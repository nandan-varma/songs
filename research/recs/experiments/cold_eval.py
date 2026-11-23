import sys, time, json, numpy as np, scipy.sparse as sp
import rlib, enc

def a_scores(w, X, seeds, pool, noise=0.0, rng=None, weight=1.0):
    r = rlib.Ridge(rlib.DIM)
    for s in seeds: r.observe(w.X[s], 1.0, weight)
    mean = X[pool] @ r.mean_w()
    if noise > 0:
        var = X[pool].multiply(X[pool]) @ r.var_w()
        mean = mean + noise * np.sqrt(np.asarray(var).ravel()) * rng.standard_normal(len(pool))
    return mean

def dense_ridge(E, seeds, pool, lam=1.0):
    S = E[seeds]; A = lam * np.eye(E.shape[1]) + S.T @ S
    wv = np.linalg.solve(A, S.sum(0))
    return E[pool] @ wv

def rocchio(E, seeds, pool):
    return E[pool] @ E[seeds].mean(0)

def evaluate(w, cold, E_by_fold, models, folds=(0, 1, 2), nseed=5, k=20, seed=0):
    rng = np.random.default_rng(seed)
    rows = {m: {'loose': [], 'strict': [], 'lang': [], 'fold': []} for m in models}
    pool_all = np.where(cold)[0]
    for f in folds:
        E = E_by_fold[f]
        for pi in np.where(w.fold == f)[0]:
            order = w.seedorder[pi]
            seeds = order[:nseed]
            rest = [i for i in order[nseed:] if cold[i]]
            if len(rest) < 2: continue
            pool = pool_all[~np.isin(pool_all, seeds)]
            relmask = np.isin(pool, rest)
            arts, albs = w.strict_block(seeds)
            conf = w.conflict(pool, arts, albs)
            ctx = dict(w=w, E=E, seeds=seeds, pool=pool, rng=rng)
            for name, fn in models.items():
                sc = fn(ctx)
                for mode, keep in (('loose', np.ones(len(pool), bool)), ('strict', ~conf)):
                    rm = relmask[keep]
                    if rm.sum() < 1: rows[name][mode].append(None); continue
                    rows[name][mode].append(rlib.ndcg_recall(sc[keep], rm, k))
                rows[name]['lang'].append(w.plang[pi]); rows[name]['fold'].append(f)
    return rows
