import os, sys, pickle, numpy as np, scipy.sparse as sp, rlib, personas, rdata
from sklearn.linear_model import LogisticRegression
from concurrent.futures import ProcessPoolExecutor

SRC = rdata.W + '/personas'
THEMES = list(personas.THEMES) + list(personas.COMPOSITE)
W = None

def init():
    global W
    W = rlib.World()

def one(args):
    lang, theme = args
    fn = f'{SRC}/arch_{lang}_{theme}.npy'
    if os.path.exists(fn): return fn
    d = np.load(f'{SRC}/{lang}_{theme}.npz')
    hold = set(d['pls'].tolist())
    F = sp.hstack([W.X, sp.csr_matrix(d['E'])]).tocsr()
    rng = np.random.default_rng(0)
    cols = []
    langs = sorted(set(W.lang) - {'english', ''})
    for scope in langs + ['*']:
        for t in THEMES:
            pls = [pi for pi in personas.pls_for(W, scope, t)] if scope != '*' else sorted({pi for l in langs for pi in personas.pls_for(W, l, t)})
            pls = [pi for pi in pls if pi not in hold]
            pos = {i for pi in pls for i in W.P[pi] if scope == '*' or W.lang[i] == scope}
            if len(pos) < 60: continue
            pool = np.arange(W.N) if scope == '*' else np.where(W.lang == scope)[0]
            pos = np.array(sorted(pos)); neg = np.setdiff1d(pool, pos)
            neg = rng.choice(neg, min(len(neg), 4 * len(pos)), replace=False)
            idx = np.concatenate([pos, neg]); y = np.r_[np.ones(len(pos)), np.zeros(len(neg))]
            m = LogisticRegression(C=0.5, max_iter=200).fit(F[idx], y)
            s = m.decision_function(F).astype(np.float32)
            cols.append((scope, t, s))
    A = np.stack([c[2] for c in cols], 1)
    np.save(fn, A)
    pickle.dump([(c[0], c[1]) for c in cols], open(f'{SRC}/arch_{lang}_{theme}.keys', 'wb'))
    return fn

if __name__ == '__main__':
    jobs = pickle.load(open(SRC + '/jobs.pkl', 'rb'))
    sel = jobs if os.environ.get('ALL') else jobs[::2]
    with ProcessPoolExecutor(5, initializer=init) as ex:
        for fn in ex.map(one, sel): print(fn, flush=True)
