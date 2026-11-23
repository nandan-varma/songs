"""Stateless hashed song features (no fitted vocabulary, no hosted index).

A song is turned into a bag of string tokens built only from fields the API
returns at runtime.  Each token is hashed (FNV-1a 64) into one of 2**bits
buckets with a +-1 sign, weighted, optionally idf-scaled with a *shipped
per-bucket idf table* (the only artefact, 2**bits bytes), summed, L2-normalised.
Optionally the sparse bucket vector is projected to k dense dims with a fixed
random +-1/sqrt(k) matrix that is regenerated from splitmix64 (no stored matrix).

Everything is integer arithmetic on UInt64 with wrap-around so it ports 1:1 to Swift
(use &* and &+; UInt64 operators).
"""
import re, math, numpy as np, scipy.sparse as sp

M64 = (1 << 64) - 1
FNV_OFF, FNV_PRIME = 0xcbf29ce484222325, 0x100000001b3

# ---- default (best) configuration; see RESULTS.md.  weights are per token type.
# Chosen on a dev fold (see RESULTS.md): 2**15 buckets, PLAIN weights (no idf), kept SPARSE.
# k/seed are only used by the optional dense projection, which turned out to be much worse (not recommended).
DEFAULT = dict(bits=15, k=128, idf=False, seed=0x5EED,
               w=dict(a=0.5, m=0.25, lb=0.5, lg=0.5, y=0.25, d=0.5, al=1.0, x=0.5, w=0.5))
# Extra (non-hashed) coordinates appended after the hashed block, each scaled by w/5 (z-scored, clipped to +-3):
#   audio (11): voice, danceable, happy, sad, relaxed, party, acoustic, electronic, arousal, valence, tempo  -> w=0.3
#   steer (14): recency, 12 language one-hots (hot-now optional)                                              -> w=1.0
ATT_W_AUDIO, ATT_W_STEER, ATT_SCALE = 0.3, 1.0, 5.0
# Learner priors: lam0=0.3 for the hashed block alone, 1.0 when the ATT columns are appended.

def fnv1a64(s: str) -> int:
    h = FNV_OFF
    for b in s.encode('utf-8'):
        h = ((h ^ b) * FNV_PRIME) & M64
    return h

_word = re.compile(r'\w+', re.U)

def tokens(s: dict, w: dict) -> list:
    """Return deduplicated [(type, 'type|value')] for song dict s. Types with weight 0 are skipped."""
    out = []
    def add(t, v):
        if w.get(t, 0) > 0 and v: out.append((t, t + '|' + v))
    arts = [a for a, _ in (s.get('artists') or [])] + [a for a, _ in (s.get('feat') or [])]
    for a in arts: add('a', str(a))                                  # primary + featured artist ids
    for m in (s.get('music') or '').split(','): add('m', m.strip().lower())   # composer names
    add('al', str(s.get('album_id') or ''))                          # album id
    add('lb', (s.get('label') or '').strip().lower())                # label
    add('lg', s.get('lang') or '')                                   # language
    try:
        y = int(s['year']); add('y', str(y)); add('d', str(y // 5))  # year and 5-year bucket
    except Exception: pass
    if arts and s.get('lang'): add('x', str(arts[0]) + '|' + s['lang'])   # artist x language cross
    for t in _word.findall((s.get('title') or '').lower()):            # title words (len>=2)
        if len(t) >= 2: add('w', t)
    seen, res = set(), []
    for t, k in out:
        if k not in seen: seen.add(k); res.append((t, k))
    return res

class Hasher:
    """Caches 64-bit token hashes; bucket = h & (2**bits-1); sign = +1 if bit 32 of h is set else -1."""
    def __init__(self): self.c = {}
    def h(self, key):
        v = self.c.get(key)
        if v is None: v = self.c[key] = fnv1a64(key)
        return v

def sparse_features(songs, cfg=DEFAULT, hasher=None, idf=None):
    """songs: list of dicts -> CSR (n x 2**bits) float32, rows L2-normalised.
    idf: optional float array (2**bits) of per-bucket idf (None -> plain weights)."""
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
    """Shippable artefact: idf per bucket from catalog snapshot, quantisable to uint8. idf=log((1+N)/(1+df))+1."""
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
    """(2**bits x k) matrix of +-1/sqrt(k).  Row b, dim 64*j+i = bit i of splitmix64(seed + (b<<3) + j)."""
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
    """Project sparse bucket features to k dims and re-normalise (rows unit length)."""
    R = projection(cfg['bits'], cfg['k'], cfg['seed']) if R is None else R
    D = np.asarray(Xs @ R, dtype=np.float32); n = np.linalg.norm(D, axis=1, keepdims=True); n[n == 0] = 1
    return D / n


class DiagBayes:
    """Diagonal-precision Bayesian linear learner over sparse rows (per-feature Gaussian posterior).

    prior N(0, 1/lam0) per feature; observing row x with target y adds x_j^2 to the precision of j and
    x_j*y to its information mean.  Likes: y=1.  Explicit negatives (shown & rejected): y=0 (precision only).
    Mean weight = b/A.  Thompson-style draw: w = b/A + tau*N(0,1)/sqrt(A) (tau ~ 0.02 keeps it benign).
    State = two float arrays of length 2**bits (+ATT dims); updates are O(nnz).
    """
    def __init__(self, dim, lam0=0.3):
        self.A = np.full(dim, float(lam0)); self.b = np.zeros(dim)
    def update(self, row, y):               # row: 1xD CSR
        i, v = row.indices, row.data.astype(np.float64)
        self.A[i] += v * v
        if y: self.b[i] += v * y
    def weights(self, tau=0.0, rng=None):
        w = self.b / self.A
        return w + tau * (rng or np.random).standard_normal(len(w)) / np.sqrt(self.A) if tau else w
    def score(self, X, tau=0.0, rng=None):  # X: CSR candidates
        return X @ self.weights(tau, rng).astype(np.float32)

if __name__ == '__main__':      # smoke test on the playlist crawl (needs scratchpad data)
    import json, sys
    songs = [s for l in open(sys.argv[1] if len(sys.argv) > 1 else 'data/playlists.jsonl') for s in json.loads(l)['songs']][:2000]
    X = sparse_features(songs); m = DiagBayes(X.shape[1]); m.update(X[0], 1)
    print(X.shape, 'nnz/song', X.nnz / X.shape[0], 'top-3 vs song0:', np.argsort(-m.score(X))[:3])
