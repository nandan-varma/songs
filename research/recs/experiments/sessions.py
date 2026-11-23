import argparse, pickle, numpy as np, scipy.sparse as sp, collections
import rlib, enc

ap = argparse.ArgumentParser()
ap.add_argument('--folds', default='0,1,2')
ap.add_argument('--steps', type=int, default=1500)
ap.add_argument('--dim', type=int, default=64)
ap.add_argument('--drift', type=int, default=1)
ap.add_argument('--out', default='')
a = ap.parse_args()
w = rlib.World()
R, S = 10, 5

class Learner:
    def __init__(self, X, decay=1.0, temp=0.04, prior=1.0, wide=None, beta=1.0):
        self.X = X; self.decay = decay; self.temp = temp; self.prior = prior
        self.r = rlib.Ridge(X.shape[1], prior); self.wide = wide; self.beta = beta
        if wide is not None:
            self.D = wide.shape[1]; self.A = np.eye(self.D) * 1.0; self.b = np.zeros(self.D)
    def observe(self, i, y, wt):
        if self.decay < 1:
            self.r.prec = self.prior + self.decay * (self.r.prec - self.prior); self.r.info *= self.decay
            if self.wide is not None: self.A = np.eye(self.D) + self.decay * (self.A - np.eye(self.D)); self.b *= self.decay
        self.r.observe(self.X[i], y, wt)
        if self.wide is not None:
            e = self.wide[i]; self.A += wt * np.outer(e, e); self.b += wt * y * e
    def score(self, pool, rng):
        P = self.X[pool]
        m = P @ self.r.mean_w()
        if self.temp:
            var = np.asarray(P.multiply(P) @ self.r.var_w()).ravel()
            m = m + self.temp * np.sqrt(var) * rng.standard_normal(len(m))
        if self.wide is not None:
            Ai = np.linalg.inv(self.A); E = self.wide[pool]
            dm = E @ (Ai @ self.b)
            if self.temp:
                dv = np.einsum('ij,jk,ik->i', E, Ai, E)
                dm = dm + self.temp * np.sqrt(np.maximum(dv, 0)) * rng.standard_normal(len(dm))
            m = m + self.beta * dm
        return m

def select(sc, pool, last_artist, last_album):
    order = np.argsort(-sc, kind='stable'); out = []; counts = collections.Counter(); seen = set()
    for k in order:
        i = pool[k]; art = w.prim[i]; alb = w.album[i]
        key = (w.songs[w.ids[i]]['title'].lower(), art)
        if art == last_artist and art: continue
        if alb and alb == last_album: continue
        if counts[art] >= 2 or key in seen: continue
        out.append(i); counts[art] += 1; seen.add(key); last_artist = art; last_album = alb
        if len(out) == S: break
    return out

def entropy(vals):
    c = np.array(list(collections.Counter(vals).values()), float); p = c / c.sum()
    return float(-(p * np.log(p)).sum())

def session(mk, pi, pj, rng, seedsong, pool_all, T1, T2):
    L = mk(); L.observe(seedsong, 1.0, 2.0)
    shown = {seedsong}; last_a, last_b = w.prim[seedsong], w.album[seedsong]
    hits = []; arts = []; langs = []; T = T1
    for r in range(R):
        if r == 5 and a.drift: T = T2
        pool = pool_all[~np.isin(pool_all, list(shown))]
        sl = select(L.score(pool, rng), pool, last_a, last_b)
        h = 0
        for i in sl:
            shown.add(i); rel = i in T
            if rel:
                if rng.random() < 0.12: f = rng.random() * 0.4; L.observe(i, 2 * f - 1, 1.0) if f >= 0.1 else None; rel = False
                else:
                    h += 1
                    if rng.random() < 0.3: L.observe(i, 1.0, 4.0)
                    else: L.observe(i, 1.0, 1.0)
            else:
                if rng.random() < 0.05: L.observe(i, 1.0, 1.0)
                elif rng.random() < 0.35: L.observe(i, -1.0, 3.0)
                else:
                    f = rng.random() * 0.6
                    if f >= 0.1: L.observe(i, 2 * f - 1, 1.0)
            arts.append(w.prim[i]); langs.append(w.lang[i])
        last_a, last_b = w.prim[sl[-1]], w.album[sl[-1]]
        hits.append(h / S)
    return np.array(hits), len(set(arts)) / len(arts), entropy(langs)

names = ['A_current', 'A_greedy', 'A_decay0.97', 'A_decay0.9', 'A+D_diag', 'A+D_wide', 'A_decay0.97+D_wide', 'D_only_wide']
res = {n: [] for n in names}
meta = []
for f in [int(x) for x in a.folds.split(',')]:
    tr = [p for pi, p in enumerate(w.P) if w.fold[pi] != f]
    v = enc.Vocab(w, sorted({i for p in tr for i in p}))
    _, E = enc.train(w, v, tr, dim=a.dim, steps=a.steps)
    Xc = sp.hstack([w.X, sp.csr_matrix((0.5 * E).astype(np.float32))]).tocsr()
    Xz = sp.csr_matrix(w.X.shape, dtype=np.float32)
    mks = {
        'A_current': lambda: Learner(w.X), 'A_greedy': lambda: Learner(w.X, temp=0),
        'A_decay0.97': lambda: Learner(w.X, decay=0.97), 'A_decay0.9': lambda: Learner(w.X, decay=0.9),
        'A+D_diag': lambda: Learner(Xc), 'A+D_wide': lambda: Learner(w.X, wide=E, beta=1.0),
        'A_decay0.97+D_wide': lambda: Learner(w.X, decay=0.97, wide=E, beta=1.0),
        'D_only_wide': lambda: Learner(Xz, wide=E, beta=1.0),
    }
    pls = np.where(w.fold == f)[0]
    for k, pi in enumerate(pls):
        if len(w.P[pi]) < 12: continue
        rng0 = np.random.default_rng(1000 * f + k)
        pj = pls[(k + 1 + rng0.integers(len(pls) - 1)) % len(pls)]
        if pj == pi: continue
        T1 = set(w.P[pi]); T2 = set(w.P[pj])
        seedsong = w.seedorder[pi][0]
        langset = {w.plang[pi], w.plang[pj]} if a.drift else {w.plang[pi]}
        pool_all = np.where(np.isin(w.lang, list(langset)))[0]
        meta.append((w.plang[pi], w.plang[pj] == w.plang[pi]))
        for nm in names:
            res[nm].append(session(mks[nm], pi, pj, np.random.default_rng(7 * k + f), seedsong, pool_all, T1, T2))
    print('fold', f, flush=True)
def tg(h, thr=0.4, start=0):
    for r in range(start, len(h)):
        if h[r] >= thr: return r - start + 1
    return len(h) - start + 2
print('sessions', len(meta), 'drift', a.drift)
base = None
for nm in names:
    H = np.array([x[0] for x in res[nm]]); mean = H.mean(1); pre = H[:, :5].mean(1); post = H[:, 5:].mean(1)
    ttg = np.array([tg(h) for h in H]); rec = np.array([tg(h, 0.4, 5) for h in H])
    ad = np.array([x[1] for x in res[nm]]); le = np.array([x[2] for x in res[nm]])
    d = '' if base is None else f' d_vs_A={rlib.mean_se(mean - base)[0]:+.4f}±{rlib.mean_se(mean - base)[1]:.4f}'
    if base is None: base = mean
    print(f"{nm:20s} hit {rlib.mean_se(mean)[0]:.3f}±{rlib.mean_se(mean)[1]:.3f} pre {pre.mean():.3f} post {post.mean():.3f} ttg {ttg.mean():.2f} recov {rec.mean():.2f} artistdiv {ad.mean():.2f} langH {le.mean():.2f}{d}")
if a.out: pickle.dump(dict(res=res, meta=meta), open(a.out, 'wb'))
