import sys, json, time, argparse, numpy as np, scipy.sparse as sp
import rlib, enc, cold_eval as ce

ap = argparse.ArgumentParser()
ap.add_argument('--kind', default='song')
ap.add_argument('--dim', type=int, default=64)
ap.add_argument('--hidden', type=int, default=0)
ap.add_argument('--steps', type=int, default=1500)
ap.add_argument('--drop', type=float, default=0.25)
ap.add_argument('--diff', type=int, default=0)
ap.add_argument('--tau', type=float, default=0.07)
ap.add_argument('--folds', default='0,1,2')
ap.add_argument('--out', default='')
ap.add_argument('--only', default='')
a = ap.parse_args()

w = rlib.World()
cold = w.cold_mask(a.kind, 0.2, seed=1)
folds = [int(x) for x in a.folds.split(',')]
E_by = {}
t0 = time.time()
for f in folds:
    tr = [[i for i in p if not cold[i]] for pi, p in enumerate(w.P) if w.fold[pi] != f]
    trs = sorted({i for p in tr for i in p})
    v = enc.Vocab(w, trs)
    m, E = enc.train(w, v, tr, dim=a.dim, hidden=a.hidden, drop=a.drop, steps=a.steps, diff_artist=bool(a.diff), tau=a.tau)
    E_by[f] = E
    print('fold', f, 'trained', round(time.time() - t0), 'vocab', v.size, flush=True)

def mk(alpha):
    def fn(ctx):
        E = ctx['E']; X = ctx['w'].X
        Xc = sp.hstack([X, sp.csr_matrix(alpha * E)]).tocsr()
        return Xc
    return fn

cache = {}
def concat(ctx, alpha):
    key = (id(ctx['E']), alpha)
    if key not in cache:
        cache[key] = sp.hstack([ctx['w'].X, sp.csr_matrix((alpha * ctx['E']).astype(np.float32))]).tocsr()
    return cache[key]

def a_cat(alpha, noise=0.0):
    def fn(ctx):
        X = concat(ctx, alpha); w = ctx['w']
        r = rlib.Ridge(X.shape[1])
        for s in ctx['seeds']: r.observe(X[s], 1.0, 1.0)
        P = X[ctx['pool']]
        mean = P @ r.mean_w()
        if noise:
            var = np.asarray(P.multiply(P) @ r.var_w()).ravel()
            mean = mean + noise * np.sqrt(var) * ctx['rng'].standard_normal(len(mean))
        return mean
    return fn

def zs(x):
    return (x - x.mean()) / (x.std() + 1e-9)

models = {
    'random': lambda c: c['rng'].random(len(c['pool'])),
    'A_greedy': lambda c: ce.a_scores(c['w'], c['w'].X, c['seeds'], c['pool']),
    'A_thompson': lambda c: ce.a_scores(c['w'], c['w'].X, c['seeds'], c['pool'], noise=0.04, rng=c['rng']),
    'D_rocchio': lambda c: ce.rocchio(c['E'], c['seeds'], c['pool']),
    'D_ridge': lambda c: ce.dense_ridge(c['E'], c['seeds'], c['pool'], 1.0),
}
for al in (0.25, 0.5, 1.0):
    models[f'A+D_diag_{al}'] = a_cat(al)
for b in (0.5, 1.0, 2.0):
    models[f'A+D_add_{b}'] = (lambda b: lambda c: zs(ce.a_scores(c['w'], c['w'].X, c['seeds'], c['pool'])) + b * zs(ce.dense_ridge(c['E'], c['seeds'], c['pool'], 1.0)))(b)

if a.only:
    models = {k: v for k, v in models.items() if k in a.only.split(',')}
rows = ce.evaluate(w, cold, E_by, models, folds)
res = {}
for name, r in rows.items():
    d = {}
    for mode in ('loose', 'strict'):
        v = np.array([x for x in r[mode] if x is not None]); d[mode] = (rlib.mean_se(v[:, 0]), rlib.mean_se(v[:, 1]), len(v))
    res[name] = d
    print(f"{name:16s} loose nDCG {d['loose'][0][0]:.4f}±{d['loose'][0][1]:.4f} R {d['loose'][1][0]:.3f} | strict nDCG {d['strict'][0][0]:.4f}±{d['strict'][0][1]:.4f} R {d['strict'][1][0]:.3f} n={d['strict'][2]}")
if a.out:
    import pickle; pickle.dump(dict(rows=rows, args=vars(a)), open(a.out, 'wb'))
