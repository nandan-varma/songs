import numpy as np, scipy.sparse as sp
import rdata

DIM = 1 << 15
M64 = (1 << 64) - 1

def fnv(tok):
    h = 0xcbf29ce484222325
    for b in tok.encode():
        h = ((h ^ b) * 0x100000001b3) & M64
    return h

def hashed(songs, ids):
    rows, cols, vals = [], [], []
    for i, sid in enumerate(ids):
        acc = {}
        for tok, w in rdata.tokens(songs[sid]):
            h = fnv(tok)
            acc[h & 0x7fff] = acc.get(h & 0x7fff, 0.0) + w * (1.0 if (h >> 32) & 1 == 0 else -1.0)
        n = np.sqrt(sum(v * v for v in acc.values())) or 1.0
        for c, v in acc.items():
            rows.append(i); cols.append(c); vals.append(v / n)
    return sp.csr_matrix((vals, (rows, cols)), shape=(len(ids), DIM), dtype=np.float32)

class World:
    def __init__(self):
        self.pls, self.songs = rdata.load()
        self.ids = sorted(self.songs)
        self.ix = {s: i for i, s in enumerate(self.ids)}
        self.N = len(self.ids)
        S = [self.songs[s] for s in self.ids]
        self.lang = np.array([s['lang'] for s in S])
        self.year = np.array([s['year'] for s in S])
        self.prim = [rdata.primary(s) for s in S]
        self.anames = [set(rdata.artist_names(s)) for s in S]
        self.album = [s['album_id'] for s in S]
        self.X = hashed(self.songs, self.ids)
        self.P = [[self.ix[s] for s in p['songs']] for p in self.pls]
        self.seedorder = [[self.ix[s] for s in rdata.perm(p['id'], p['songs'])] for p in self.pls]
        self.fold = rdata.folds(self.pls)
        self.plang = []
        for p in self.P:
            vals, cnt = np.unique(self.lang[p], return_counts=True)
            self.plang.append(vals[cnt.argmax()])
        self.tok = [[t for t, _ in rdata.tokens(self.songs[s])] for s in self.ids]
        self.tokw = [[w for _, w in rdata.tokens(self.songs[s])] for s in self.ids]

    def cold_mask(self, kind, frac=0.2, seed=0):
        r = np.random.default_rng(seed)
        if kind == 'song':
            return r.random(self.N) < frac
        arts = sorted(set(self.prim))
        pick = set(r.choice(len(arts), int(frac * len(arts)), replace=False))
        amap = {a: i for i, a in enumerate(arts)}
        return np.array([amap[a] in pick for a in self.prim])

    def strict_block(self, seeds):
        arts = set().union(*[self.anames[i] for i in seeds])
        albs = {self.album[i] for i in seeds if self.album[i]}
        return arts, albs

    def conflict(self, cand, arts, albs):
        return np.array([bool(self.anames[i] & arts) or (self.album[i] in albs) for i in cand])

def dcg(rel):
    return (rel / np.log2(np.arange(2, len(rel) + 2))).sum()

def ndcg_recall(scores, relmask, k=20):
    n = relmask.sum()
    if n == 0: return None
    top = np.argpartition(-scores, min(k, len(scores) - 1))[:k]
    top = top[np.argsort(-scores[top], kind='stable')]
    r = relmask[top].astype(float)
    ideal = dcg(np.ones(min(n, k)))
    return dcg(r) / ideal, r.sum() / min(n, k)

def mean_se(x):
    x = np.asarray(x, float)
    return x.mean(), x.std(ddof=1) / np.sqrt(len(x)) if len(x) > 1 else 0.0

class Ridge:
    def __init__(self, dim, prior=1.0):
        self.prec = np.full(dim, prior, np.float32); self.info = np.zeros(dim, np.float32)
    def observe(self, x, target, weight):
        idx = x.indices; v = x.data
        self.prec[idx] += weight * v * v; self.info[idx] += weight * target * v
    def mean_w(self):
        return self.info / self.prec
    def var_w(self):
        return 1.0 / self.prec
