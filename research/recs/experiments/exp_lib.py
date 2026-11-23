"""Shared machinery for the stateless-feature experiment (offline, headless)."""
import zlib, os, sys, math, json, random, collections, re, pickle, time, numpy as np, scipy.sparse as sp
from sklearn.preprocessing import normalize
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
S = '/private/tmp/claude-501/-Users-nandan-dev-web-music-music-api/0c615e2d-e85f-41eb-99bc-164d1e551c62/scratchpad'
sys.path.insert(0, '/Users/nandan/dev/web/music/music-api/tools/recs'); sys.path.insert(0, os.path.dirname(__file__))
os.chdir(S)
import build_feats as bf
import hashed_features as hf
OUT = S + '/exp1'

F, songs, ids, P = bf.load(); N = len(ids); ix = {s: i for i, s in enumerate(ids)}
PI = [[ix[s] for s in p] for p in P]
_rng = random.Random(11); _perm = list(range(len(P))); _rng.shuffle(_perm)
FOLD = {pi: k % 4 for k, pi in enumerate(_perm)}            # fold 0 = dev, 1..3 = eval reps
S_ = [songs[i] for i in ids]
LANG = [s.get('lang') or '' for s in S_]
ART = [[a for a, _ in s['artists'] + s['feat']] for s in S_]
ALB = [s.get('album_id') or '' for s in S_]
_ar = {a: j for j, a in enumerate(sorted({a for l in ART for a in l}))}
AM = sp.csr_matrix(([1.0] * sum(len(l) for l in ART), ([i for i, l in enumerate(ART) for _ in l], [_ar[a] for l in ART for a in l])), shape=(N, len(_ar)))
AM.data[:] = 1; AM = AM.tocsr()
ALBI = np.array([zlib.crc32(a.encode()) if a else -1 for a in ALB])
def relnum(s):
    r = s.get('rel') or ''
    try: return int(r[:4]) * 12 + int(r[5:7]) - 1
    except Exception: return None
REL = [relnum(s) for s in S_]
MAXREL = max(r for r in REL if r)

def cold_mask(scen, seed):
    rng = np.random.default_rng(seed); kind, par = scen
    if kind == 'rand': return rng.random(N) < par
    if kind == 'recent': return np.array([r is not None and r > MAXREL - par for r in REL])
    if kind == 'newartist':
        prim = collections.defaultdict(list)
        for i, l in enumerate(ART): prim[l[0] if l else 'none%d' % i].append(i)
        keys = list(prim); rng.shuffle(keys); m = np.zeros(N, bool); n = 0
        for k in keys:
            if n >= par * N: break
            m[prim[k]] = True; n += len(prim[k])
        return m
    raise ValueError(scen)

class Ctx: pass
def make_ctx(fold, scen, seed=None):
    c = Ctx(); c.fold, c.scen = fold, scen
    c.cold = cold_mask(scen, 1000 + fold if seed is None else seed); c.warm = ~c.cold; w = np.where(c.warm)[0]
    c.Ptr = [[i for i in p if c.warm[i]] for k, p in enumerate(PI) if FOLD[k] != fold]
    c.Ptr = [[ids[i] for i in p] for p in c.Ptr if len(p) >= 2]
    B = bf.build(F, songs, ids, c.Ptr); c.B = B
    toks = [bf.toks(s) for s in S_]
    tf = TfidfVectorizer(analyzer=lambda x: x, sublinear_tf=True).fit([toks[i] for i in w])
    C = normalize(tf.transform(toks)); svd = TruncatedSVD(64, random_state=0).fit(C[w])
    c.Zw = normalize(svd.transform(C)); c.Zcat = B['Z']; c.E = B['E']; c.A = B['A']; c.ATTz = B['ATTz'].copy()
    c.ATTz_nohot = c.ATTz.copy(); c.ATTz_nohot[:, 11] = 0
    c.Cw = C
    c.hasher = hf.Hasher()
    # eval playlists
    c.ev = [k for k in range(len(PI)) if FOLD[k] == fold]
    return c

def lang_of(pl):
    cnt = collections.Counter(LANG[i] for i in pl); l, n = cnt.most_common(1)[0]
    return l if n >= 0.5 * len(pl) else 'mixed'

# ---------- design builders
def nrm(X): return X / np.maximum(np.linalg.norm(X, axis=1, keepdims=True), 1e-9)
AUDIO = list(range(0, 11)); NONAUD = list(range(11, 25)); ALLC = list(range(25))
def att_block(c, cols, wT, noise=0.0, seed=0, nohot=False):
    Z = (c.ATTz_nohot if nohot else c.ATTz)[:, cols].copy()
    if noise:
        rng = np.random.default_rng(seed); au = [j for j, cc in enumerate(cols) if cc < 11]
        Z[:, au] += noise * rng.standard_normal((N, len(au))); Z = np.clip(Z, -3, 3)   # attrs are z-scored, so std=1
    return wT / 5.0 * Z

def dense_design(c, wZ=0, wE=0, wA=0, hashed=None, att=None):
    parts = []
    if wZ: parts.append(wZ * c.Zw)
    if wE: parts.append(wE * c.E)
    if wA: parts.append(wA * c.A)
    if hashed is not None: parts.append(hashed)
    X = nrm(np.hstack(parts))
    if att is not None: X = np.hstack([X, att])
    return X.astype(np.float32)

def hashed_sparse(c, cfg, idf=True):
    w = np.where(c.warm)[0]
    key = ('sp', json.dumps(cfg, sort_keys=True, default=str), idf)
    cache = c.__dict__.setdefault('_hc', {})
    if key in cache: return cache[key]
    idfv = hf.bucket_idf([S_[i] for i in w], cfg, c.hasher) if idf else None
    X = hf.sparse_features(S_, cfg, c.hasher, idfv); cache[key] = X; return X

def hashed_dense(c, cfg, idf=True):
    Xs = hashed_sparse(c, cfg, idf)
    return hf.dense_features(Xs, cfg)

# ---------- items
def p1_items(c, variant, draws=2, seedn=5, minT=3, cap=None):
    items = []
    for k in c.ev:
        pl = list(dict.fromkeys(PI[k]))
        if len(pl) < 12: continue
        for d in range(draws):
            rng = random.Random(zlib.crc32(repr((c.fold, k, d, variant)).encode()))
            if variant == 'all': pool = pl
            else:
                pool = [i for i in pl if c.warm[i]]
                if len(pool) < seedn: continue
            sd = rng.sample(pool, seedn)
            v = np.asarray(AM[sd].sum(0)).ravel(); ex = (AM @ v) > 0
            ex |= np.isin(ALBI, ALBI[sd][ALBI[sd] >= 0])
            ex[sd] = True
            if variant == 'all': tg = [i for i in pl if not ex[i]]
            else:
                tg = [i for i in pl if c.cold[i] and not ex[i]]
                ex = ex | np.isin(np.arange(N), [i for i in pl if c.warm[i]])   # other warm members: ignored
            if len(tg) < minT: continue
            items.append(dict(sd=sd, ex=ex, tg=np.array(tg), lang=lang_of(pl), k=k))
    if cap and len(items) > cap: items = random.Random(5).sample(items, cap)
    return items

def p1_eval(X, items, K=20, R=100):
    nd, rc = [], []
    for it in items:
        sd = it['sd']
        cen = np.asarray(X[sd].mean(0)).ravel() if not sp.issparse(X) else np.asarray(X[sd].mean(0)).ravel()
        s = np.asarray(X @ cen).ravel().astype(np.float64); s[it['ex']] = -1e9
        top = np.argpartition(-s, R)[:R]; top = top[np.argsort(-s[top])]
        tgs = np.zeros(N, bool); tgs[it['tg']] = True; rel = tgs[top]
        dcg = (rel[:K] / np.log2(np.arange(2, K + 2))).sum(); idcg = (1 / np.log2(np.arange(2, min(K, len(it['tg'])) + 2))).sum()
        nd.append(dcg / idcg); rc.append(rel.sum() / len(it['tg']))
    return np.array(nd), np.array(rc)

def p2_items(c, variant, cap=150, minlen=20, minT=3):
    items = []
    for k in c.ev:
        pl = list(dict.fromkeys(PI[k]))
        if len(pl) < minlen: continue
        if variant == 'all': tg = pl; excl = []; pool = pl
        else:
            tg = [i for i in pl if c.cold[i]]; excl = [i for i in pl if c.warm[i]]; pool = excl
            if len(tg) < minT or not pool: continue
        items.append(dict(k=k, tg=set(tg), excl=excl, pool=pool, lang=lang_of(pl)))
    random.Random(9).shuffle(items); return items[:cap]

def p2_run(X, it, seed, lam=3.0, kind='dense', rounds=10, slate=5, tau=0.0):
    rng = np.random.default_rng(seed); tgt = it['tg']
    s0 = it['pool'][int(rng.integers(len(it['pool'])))]; seen = {s0}; D = X.shape[1]
    blocked = np.zeros(N, bool); blocked[it['excl']] = True
    if kind == 'dense':
        x = X[s0].astype(np.float64); A = lam * np.eye(D) + np.outer(x, x); b = x.copy()
    else:
        ip, ind, dat = X.indptr, X.indices, X.data.astype(np.float64)
        A = np.full(D, float(lam)); b = np.zeros(D)
        def upd(t, y):
            sl = slice(ip[t], ip[t + 1]); ii = ind[sl]; v = dat[sl]; A[ii] += v * v
            if y: b[ii] += v
        upd(s0, True)
    hist = []
    for r in range(rounds):
        if kind == 'dense': w = np.linalg.solve(A, b)
        else:
            w = b / A
            if tau: w = w + tau * rng.standard_normal(D) / np.sqrt(A)
        sc = np.asarray(X @ w.astype(np.float32)).ravel().astype(np.float64)
        sc[list(seen)] = -1e9; sc[blocked] = -1e9
        top = np.argpartition(-sc, slate)[:slate]; hit = 0
        for t in top:
            seen.add(int(t)); like = int(t) in tgt
            if kind == 'dense':
                x = X[t].astype(np.float64)
                if like: A += np.outer(x, x); b += x; hit += 1
                elif rng.random() < 0.6: A += np.outer(x, x)
            else:
                if like: upd(t, True); hit += 1
                elif rng.random() < 0.6: upd(t, False)
        hist.append(hit / slate)
    return np.mean(hist), np.mean(hist[5:])

def p2_eval(designs, items, seed0=0):
    """designs: {name:(kind,X,lam[,tau])}. Returns {name:(mean_arr,late_arr)}."""
    res = {n: ([], []) for n in designs}
    for j, it in enumerate(items):
        for n, d in designs.items():
            kind, X, lam = d[:3]; tau = d[3] if len(d) > 3 else 0.0
            a, b = p2_run(X, it, seed0 + j, lam, kind, tau=tau); res[n][0].append(a); res[n][1].append(b)
    return {n: (np.array(a), np.array(b)) for n, (a, b) in res.items()}

def p1_all(designs, items):
    return {n: p1_eval(d[1], items) for n, d in designs.items()}
