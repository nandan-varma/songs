import collections, numpy as np
import rlib

S = 5
CAP = 2
CONSEC = True

class Learner:
    def __init__(self, X, prior=1.0, temp=0.04, wide=None, beta=1.0, centroid=0.0, seedw=2.0, pool=None, pu_k=0, pu_w=0.1, rng=None):
        self.pool = pool; self.pu_k = pu_k; self.pu_w = pu_w; self.prng = rng or np.random.default_rng(1)
        self.X = X; self.temp = temp; self.wide = wide; self.beta = beta; self.centroid = centroid
        self.r = rlib.Ridge(X.shape[1], prior)
        if wide is not None:
            self.D = wide.shape[1]; self.A = np.eye(self.D); self.b = np.zeros(self.D)
        self.pos = np.zeros(wide.shape[1] if wide is not None else 0); self.npos = 0.0
    def observe(self, i, y, wt):
        self.r.observe(self.X[i], y, wt)
        if self.pu_k and y > 0:
            for j in self.prng.choice(self.pool, self.pu_k, replace=False):
                self.r.observe(self.X[j], -1.0, self.pu_w * wt)
        if self.wide is not None:
            e = self.wide[i]; self.A += wt * np.outer(e, e); self.b += wt * y * e
            if y > 0: self.pos += wt * y * e; self.npos += wt * y
    def score(self, pool, rng):
        P = self.X[pool]
        m = P @ self.r.mean_w()
        if self.temp:
            var = np.asarray(P.multiply(P) @ self.r.var_w()).ravel()
            m = m + self.temp * np.sqrt(var) * rng.standard_normal(len(m))
        if self.wide is not None:
            E = self.wide[pool]
            Ai = np.linalg.inv(self.A)
            dm = E @ (Ai @ self.b)
            if self.temp:
                dv = np.einsum('ij,jk,ik->i', E, Ai, E)
                dm = dm + self.temp * np.sqrt(np.maximum(dv, 0)) * rng.standard_normal(len(dm))
            m = m + self.beta * dm
            if self.centroid and self.npos > 0:
                c = self.pos / (np.linalg.norm(self.pos) + 1e-9)
                m = m + self.centroid * (E @ c)
        return m

def select(w, sc, pool, last_artist, last_album):
    order = np.argsort(-sc, kind='stable'); out = []; counts = collections.Counter(); seen = set()
    for k in order:
        i = pool[k]; art = w.prim[i]; alb = w.album[i]
        key = (w.songs[w.ids[i]]['title'].lower(), art)
        if CONSEC and art == last_artist and art: continue
        if alb and alb == last_album: continue
        if counts[art] >= CAP or key in seen: continue
        out.append(i); counts[art] += 1; seen.add(key); last_artist = art; last_album = alb
        if len(out) == S: break
    return out

def react(L, i, liked, rng):
    if liked:
        if rng.random() < 0.12:
            f = rng.random() * 0.4
            if f >= 0.1: L.observe(i, 2 * f - 1, 1.0)
            return False
        L.observe(i, 1.0, 4.0 if rng.random() < 0.3 else 1.0)
        return True
    if rng.random() < 0.05: L.observe(i, 1.0, 1.0)
    elif rng.random() < 0.35: L.observe(i, -1.0, 3.0)
    else:
        f = rng.random() * 0.6
        if f >= 0.1: L.observe(i, 2 * f - 1, 1.0)
    return False

def taste(w, p, seed, hit=0.9, leak=0.03):
    r = np.random.default_rng(seed)
    member = np.zeros(w.N, bool); member[p['songs']] = True
    liked = np.where(member, r.random(w.N) < hit, r.random(w.N) < leak)
    return member, liked

def run(w, mk, p, n_seed, rounds, rng, member, liked):
    L = mk()
    pool_all = np.where(w.lang == p['lang'])[0]
    seeds = rng.choice(p['songs'][liked[p['songs']]], n_seed, replace=False)
    for i in seeds: L.observe(i, 1.0, 2.0)
    shown = set(seeds.tolist()); la, lb = w.prim[seeds[-1]], w.album[seeds[-1]]
    fit = []; like = []
    for r in range(rounds):
        pool = pool_all[~np.isin(pool_all, list(shown))]
        sl = select(w, L.score(pool, rng), pool, la, lb)
        fit.append(np.mean([member[i] for i in sl])); like.append(np.mean([liked[i] for i in sl]))
        for i in sl:
            shown.add(i); react(L, i, liked[i], rng)
        la, lb = w.prim[sl[-1]], w.album[sl[-1]]
    return np.array(fit), np.array(like)

from sklearn.linear_model import LogisticRegression
import scipy.sparse as sp

class LR:
    def __init__(self, F, pool_all, C=1.0, neg=60, negw=0.1, temp=0.0, rng=None, pop=None, popw=0.0, fixneg=False):
        self.fixneg = fixneg; self.fixed = None
        self.F = F; self.C = C; self.neg = neg; self.negw = negw; self.temp = temp
        self.pool_all = pool_all; self.rng = rng or np.random.default_rng(0)
        self.idx = []; self.y = []; self.wt = []; self.m = None
        self.pop = pop; self.popw = popw
    def observe(self, i, y, wt):
        self.idx.append(i); self.y.append(1 if y > 0 else 0); self.wt.append(wt * max(abs(y), 0.2))
        self.m = None
    def fit(self):
        idx = np.array(self.idx); y = np.array(self.y); wt = np.array(self.wt)
        if self.neg and self.negw:
            if self.fixneg:
                if self.fixed is None: self.fixed = self.rng.choice(self.pool_all, min(self.neg, len(self.pool_all)), replace=False)
                ng = self.fixed
            else:
                ng = self.rng.choice(self.pool_all, min(self.neg, len(self.pool_all)), replace=False)
            ng = ng[~np.isin(ng, idx)]
            idx = np.concatenate([idx, ng]); y = np.concatenate([y, np.zeros(len(ng), int)])
            wt = np.concatenate([wt, np.full(len(ng), self.negw * np.sum(wt[y[:len(wt)] == 1]) / max(len(ng), 1) * 0 + self.negw)])
        if y.min() == y.max(): return None
        self.m = LogisticRegression(C=self.C, max_iter=200).fit(self.F[idx], y, sample_weight=wt)
        return self.m
    def score(self, pool, rng):
        m = self.fit()
        sc = np.zeros(len(pool)) if m is None else m.decision_function(self.F[pool])
        if self.popw and self.pop is not None: sc = sc + self.popw * self.pop[pool]
        if self.temp: sc = sc + self.temp * rng.standard_normal(len(sc))
        return sc
