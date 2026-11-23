import sys, pickle, numpy as np, collections
import rlib
res = pickle.load(open(sys.argv[1], 'rb'))['rows']
base, others = 'A_greedy', sys.argv[2].split(',')
lang = np.array(res[base]['lang'])
def vec(nm):
    return np.array([np.nan if x is None else x[0] for x in res[nm]['strict']])
b = vec(base)
ok = ~np.isnan(b)
print('lang', 'n', base, *others)
groups = ['hindi', 'telugu', 'tamil', 'punjabi', 'kannada', 'bengali', 'marathi', 'malayalam', 'bhojpuri', 'haryanvi', 'gujarati', 'english']
for g in groups + ['ALL']:
    m = ok & ((lang == g) if g != 'ALL' else True)
    if m.sum() < 8: continue
    row = [f"{g:10s} n={m.sum():3d} {b[m].mean():.3f}±{rlib.mean_se(b[m])[1]:.3f}"]
    for o in others:
        v = vec(o); d = v[m] - b[m]
        row.append(f"{o} {v[m].mean():.3f} (d {d.mean():+.3f}±{rlib.mean_se(d)[1]:.3f})")
    print(' | '.join(row))
