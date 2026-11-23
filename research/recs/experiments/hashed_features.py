import re, math, numpy as np, scipy.sparse as sp

M64 = (1 << 64) - 1
FNV_OFF, FNV_PRIME = 0xcbf29ce484222325, 0x100000001b3

DEFAULT = dict(bits=15, k=128, idf=False, seed=0x5EED,
               w=dict(a=0.5, m=0.25, lb=0.5, lg=0.5, y=0.25, d=0.5, al=1.0, x=0.5, w=0.5))
ATT_W_AUDIO, ATT_W_STEER, ATT_SCALE = 0.3, 1.0, 5.0

def fnv1a64(s: str) -> int:
    h = FNV_OFF
    for b in s.encode('utf-8'):
        h = ((h ^ b) * FNV_PRIME) & M64
    return h

_word = re.compile(r'\w+', re.U)

def tokens(s: dict, w: dict) -> list:
    out = []
    def add(t, v):
        if w.get(t, 0) > 0 and v: out.append((t, t + '|' + v))
    arts = [a for a, _ in (s.get('artists') or [])] + [a for a, _ in (s.get('feat') or [])]
    for a in arts: add('a', str(a))
    for m in (s.get('music') or '').split(','): add('m', m.strip().lower())
    add('al', str(s.get('album_id') or ''))
    add('lb', (s.get('label') or '').strip().lower())
    add('lg', s.get('lang') or '')
    try:
        y = int(s['year']); add('y', str(y)); add('d', str(y // 5))
    except Exception: pass
    if arts and s.get('lang'): add('x', str(arts[0]) + '|' + s['lang'])
    for t in _word.findall((s.get('title') or '').lower()):
        if len(t) >= 2: add('w', t)
    seen, res = set(), []
    for t, k in out:
        if k not in seen: seen.add(k); res.append((t, k))
    return res

class Hasher:
    def __init__(self): self.c = {}
    def h(self, key):
        v = self.c.get(key)
        if v is None: v = self.c[key] = fnv1a64(key)
        return v

def sparse_features(songs, cfg=DEFAULT, hasher=None, idf=None):
    hasher = hasher or Hasher(); nb = 1 << cfg['bits']; mask = nb - 1
    r, c, v = [], [], []
    for i, s in enumerate(songs):
        for t, key in tokens(s, cfg['w']):
            h = hasher.h(key); b = h & mask; sg = 1.0 if (h >> 32) & 1 else -1.0
            val = cfg['w'][t] * sg * (idf[b] if idf is not None else 1.0)
            r.append(i); c.append(b); v.append(val)
    X = sp.csr_matrix((np.array(v, np.float32), (r, c)), shape=(len(songs), nb)); X.sum_duplicates()
    n = np.sqrt(np.asarray(X.multiply(X).sum(1)).ravel()); n[n == 0] = 1
    return sp.diags(1.0 / n).dot(X).tocsr().astype(np.float32)

def bucket_idf(songs, cfg=DEFAULT, hasher=None):
    hasher = hasher or Hasher(); nb = 1 << cfg['bits']; mask = nb - 1; df = np.zeros(nb)
    for s in songs:
        for b in {hasher.h(k) & mask for _, k in tokens(s, cfg['w'])}: df[b] += 1
    return (np.log((1 + len(songs)) / (1 + df)) + 1).astype(np.float32)

def splitmix64(x):
    x = (x + np.uint64(0x9E3779B97F4A7C15))
    z = x
    z = (z ^ (z >> np.uint64(30))) * np.uint64(0xBF58476D1CE4E5B9)
    z = (z ^ (z >> np.uint64(27))) * np.uint64(0x94D049BB133111EB)
    return z ^ (z >> np.uint64(31))

def projection(bits, k, seed=DEFAULT['seed']):
    nb = 1 << bits; nw = (k + 63) // 64
    b = np.arange(nb, dtype=np.uint64)
    cols = []
    with np.errstate(over='ignore'):
        for j in range(nw):
            wd = splitmix64(np.uint64(seed) + (b << np.uint64(3)) + np.uint64(j))
            for i in range(64): cols.append(((wd >> np.uint64(i)) & np.uint64(1)).astype(np.float32))
    R = np.stack(cols[:k], 1) * 2 - 1
    return (R / math.sqrt(k)).astype(np.float32)

def dense_features(Xs, cfg=DEFAULT, R=None):
    R = projection(cfg['bits'], cfg['k'], cfg['seed']) if R is None else R
    D = np.asarray(Xs @ R, dtype=np.float32); n = np.linalg.norm(D, axis=1, keepdims=True); n[n == 0] = 1
    return D / n

class DiagBayes:
    def __init__(self, dim, lam0=0.3):
        self.A = np.full(dim, float(lam0)); self.b = np.zeros(dim)
    def update(self, row, y):
        i, v = row.indices, row.data.astype(np.float64)
        self.A[i] += v * v
        if y: self.b[i] += v * y
    def weights(self, tau=0.0, rng=None):
        w = self.b / self.A
        return w + tau * (rng or np.random).standard_normal(len(w)) / np.sqrt(self.A) if tau else w
    def score(self, X, tau=0.0, rng=None):
        return X @ self.weights(tau, rng).astype(np.float32)

if __name__ == '__main__':
    import json, sys
    songs = [s for l in open(sys.argv[1] if len(sys.argv) > 1 else 'data/playlists.jsonl') for s in json.loads(l)['songs']][:2000]
    X = sparse_features(songs); m = DiagBayes(X.shape[1]); m.update(X[0], 1)
    print(X.shape, 'nnz/song', X.nnz / X.shape[0], 'top-3 vs song0:', np.argsort(-m.score(X))[:3])
