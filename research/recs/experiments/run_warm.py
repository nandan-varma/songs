import sys, argparse, pickle, numpy as np, scipy.sparse as sp
import rlib, enc, cold_eval as ce

ap = argparse.ArgumentParser()
ap.add_argument('--folds', default='0,1,2')
ap.add_argument('--steps', type=int, default=1500)
ap.add_argument('--dim', type=int, default=64)
ap.add_argument('--out', default='')
a = ap.parse_args()

w = rlib.World()
folds = [int(x) for x in a.folds.split(',')]

def zs(x):
    return (x - x.mean()) / (x.std() + 1e-9)

def build_cf(train_pls):
    rows = [i for p in train_pls for i in p]; cols = [j for j, p in enumerate(train_pls) for _ in p]
    M = sp.csr_matrix((np.ones(len(rows), np.float32), (rows, cols)), shape=(w.N, len(train_pls)))
    n = np.asarray(M.sum(1)).ravel()
    inv = 1.0 / np.sqrt(np.maximum(n, 1))
    return M, inv

def cf_scores(M, inv, seeds, cols=None):
    q = np.asarray((sp.diags(inv[seeds]) @ M[seeds]).sum(0)).ravel()
    if cols is not None:
        mask = np.zeros(M.shape[1], np.float32); mask[cols] = 1; q = q * mask
    return (M @ q) * inv

res = {}
names = ['random', 'A', 'CF_global', 'CF_runtime', 'D_rocchio', 'A+CF_global', 'A+CF_runtime', 'A+D', 'A+D+CF_runtime', 'A+D+CF_global']
for nm in names: res[nm] = dict(loose=[], strict=[], lang=[])
rng = np.random.default_rng(0)
for f in folds:
    tr = [p for pi, p in enumerate(w.P) if w.fold[pi] != f]
    v = enc.Vocab(w, sorted({i for p in tr for i in p}))
    _, E = enc.train(w, v, tr, dim=a.dim, steps=a.steps)
    M, inv = build_cf(tr)
    from collections import defaultdict
    ap_ = defaultdict(lambda: defaultdict(int))
    for j, p in enumerate(tr):
        for i in p:
            ap_[w.prim[i]][j] += 1
    for pi in np.where(w.fold == f)[0]:
        order = w.seedorder[pi]; seeds = order[:5]; rest = order[5:]
        if len(rest) < 3: continue
        pool = np.setdiff1d(np.arange(w.N), seeds)
        rel = np.isin(pool, rest)
        arts, albs = w.strict_block(seeds)
        conf = w.conflict(pool, arts, albs)
        cnt = defaultdict(int)
        for s in seeds:
            for an in w.anames[s]:
                for j, c in ap_.get(an, {}).items(): cnt[j] += c
        top = sorted(cnt, key=lambda j: -cnt[j])[:20]
        sA = ce.a_scores(w, w.X, seeds, pool)
        sG = cf_scores(M, inv, seeds)[pool]
        sR = cf_scores(M, inv, seeds, top)[pool] if top else np.zeros(len(pool))
        sD = ce.rocchio(E, seeds, pool)
        sc = {'random': rng.random(len(pool)), 'A': sA, 'CF_global': sG, 'CF_runtime': sR, 'D_rocchio': sD,
              'A+CF_global': zs(sA) + 0.5 * zs(sG), 'A+CF_runtime': zs(sA) + 0.5 * zs(sR), 'A+D': zs(sA) + zs(sD),
              'A+D+CF_runtime': zs(sA) + zs(sD) + 0.5 * zs(sR), 'A+D+CF_global': zs(sA) + zs(sD) + 0.5 * zs(sG)}
        for nm, s in sc.items():
            for mode, keep in (('loose', np.ones(len(pool), bool)), ('strict', ~conf)):
                if rel[keep].sum() < 1: res[nm][mode].append(None); continue
                res[nm][mode].append(rlib.ndcg_recall(s[keep], rel[keep]))
            res[nm]['lang'].append(w.plang[pi])
    print('fold', f, flush=True)
for nm in names:
    d = {m: np.array([x for x in res[nm][m] if x is not None]) for m in ('loose', 'strict')}
    print(f"{nm:16s} loose {rlib.mean_se(d['loose'][:,0])[0]:.4f}±{rlib.mean_se(d['loose'][:,0])[1]:.4f} | strict {rlib.mean_se(d['strict'][:,0])[0]:.4f}±{rlib.mean_se(d['strict'][:,0])[1]:.4f} n={len(d['strict'])}")
if a.out: pickle.dump(res, open(a.out, 'wb'))
