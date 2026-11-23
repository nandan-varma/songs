import numpy as np, scipy.sparse as sp, pickle, rlib, rdata
from sklearn.linear_model import LogisticRegression
w = rlib.World()
OUT = rdata.W + '/personas'
jobs = pickle.load(open(OUT + '/jobs.pkl', 'rb'))[::4]
pop = np.log1p(np.array([w.songs[s]['plays'] for s in w.ids], float))
rows = []
for lang, theme in jobs:
    d = np.load(f'{OUT}/{lang}_{theme}.npz'); E = d['E']; songs = d['songs']
    member = np.zeros(w.N, bool); member[songs] = True
    pool = np.where(w.lang == lang)[0]; r = np.random.default_rng(0)
    out = []
    pa = pop[pool]; rel = member[pool]
    top = np.argsort(-pa)[:100]; out.append(('pop', rel[top].mean()))
    Xc = sp.hstack([w.X, sp.csr_matrix(E)]).tocsr()
    for name, F in [('hashed', w.X), ('dense', sp.csr_matrix(E)), ('both', Xc)]:
        for n in (5, 20, 100, 400):
            tr = r.choice(pool, n * 2, replace=False); te = np.setdiff1d(pool, tr)
            y = member[tr]
            if y.sum() < 2 or (~y).sum() < 2: continue
            m = LogisticRegression(C=1.0, max_iter=300).fit(F[tr], y)
            sc = m.decision_function(F[te]); t = np.argsort(-sc)[:100]
            out.append((f'{name}{n}', member[te][t].mean()))
    rows.append((lang, theme, member[pool].mean(), dict(out)))
keys = list(rows[0][3])
print('base', np.mean([r[2] for r in rows]))
for k in keys: print(k, round(np.mean([r[3].get(k, np.nan) for r in rows]), 3))
