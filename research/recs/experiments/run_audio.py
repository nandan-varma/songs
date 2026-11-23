import glob, numpy as np, scipy.sparse as sp
import rlib, enc, rdata, cold_eval as ce
from sklearn.decomposition import PCA

w = rlib.World()
F = {}
for pat in ('feat_*.npy', 'feat2_*.npy', 'feat3_*.npy'):
    for f in sorted(glob.glob(rdata.W + '/data/' + pat)): F.update(np.load(f, allow_pickle=True).item())
has = np.array([s in F for s in w.ids])
print('audio songs in universe', has.sum())
Em = np.zeros((w.N, 1280), np.float32)
for s, d in F.items():
    if s in w.ix: Em[w.ix[s]] = d['emb']
idx = np.where(has)[0]
Z = np.zeros((w.N, 64), np.float32)
pca = PCA(64, random_state=0).fit(Em[idx])
Zp = pca.transform(Em[idx]); Zp /= np.linalg.norm(Zp - Zp.mean(0), axis=1, keepdims=True).mean()
Z[idx] = Zp - Zp.mean(0)
Z[idx] /= np.linalg.norm(Z[idx], axis=1, keepdims=True)
cold = w.cold_mask('song', 0.2, seed=1)
names = ['A', 'D_rocchio', 'audio_rocchio', 'A+D_0.5', 'A+aud_0.5', 'A+D+aud_0.25', 'A+D+aud_0.5', 'A+D+aud_1.0']
out = {n: {'strict': [], 'loose': []} for n in names}
def cat(X, parts):
    return sp.hstack([X] + [sp.csr_matrix((a * M).astype(np.float32)) for a, M in parts]).tocsr()
def sc(X, seeds, pool):
    r = rlib.Ridge(X.shape[1])
    for s in seeds: r.observe(X[s], 1.0, 1.0)
    return X[pool] @ r.mean_w()
for f in range(4):
    tr = [[i for i in p if not cold[i]] for pi, p in enumerate(w.P) if w.fold[pi] != f]
    v = enc.Vocab(w, sorted({i for p in tr for i in p}))
    _, E = enc.train(w, v, tr)
    Xs = {'A': w.X, 'A+D_0.5': cat(w.X, [(0.5, E)]), 'A+aud_0.5': cat(w.X, [(0.5, Z)]), 'A+D+aud_0.25': cat(w.X, [(0.5, E), (0.25, Z)]),
          'A+D+aud_0.5': cat(w.X, [(0.5, E), (0.5, Z)]), 'A+D+aud_1.0': cat(w.X, [(0.5, E), (1.0, Z)])}
    for pi in np.where(w.fold == f)[0]:
        order = [i for i in w.seedorder[pi] if has[i]]
        if len(order) < 7: continue
        seeds = order[:5]; rest = [i for i in order[5:] if cold[i]]
        if not rest: continue
        pool = np.where(cold & has)[0]; pool = pool[~np.isin(pool, seeds)]
        rel = np.isin(pool, rest)
        arts, albs = w.strict_block(seeds); conf = w.conflict(pool, arts, albs)
        S = {n: sc(Xs[n], seeds, pool) for n in Xs}
        S['D_rocchio'] = E[pool] @ E[seeds].mean(0); S['audio_rocchio'] = Z[pool] @ Z[seeds].mean(0)
        for n in names:
            for mode, keep in (('loose', np.ones(len(pool), bool)), ('strict', ~conf)):
                out[n][mode].append(rlib.ndcg_recall(S[n][keep], rel[keep])[0] if rel[keep].sum() else np.nan)
    print('fold', f, flush=True)
A = {m: np.array(out['A'][m]) for m in ('loose', 'strict')}
for n in names:
    for m in ('loose', 'strict'):
        v = np.array(out[n][m]); ok = ~np.isnan(v) & ~np.isnan(A[m]); d = v[ok] - A[m][ok]
        print(f"{n:14s} {m:6s} {v[ok].mean():.4f}±{v[ok].std(ddof=1)/np.sqrt(ok.sum()):.4f} d_vs_A {d.mean():+.4f}±{d.std(ddof=1)/np.sqrt(ok.sum()):.4f} n={ok.sum()}")
