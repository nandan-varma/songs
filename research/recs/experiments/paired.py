import sys, pickle, numpy as np
import rlib
res = pickle.load(open(sys.argv[1], 'rb'))
res = res.get('rows', res)
base = sys.argv[2]
def v(nm, mode):
    return np.array([np.nan if x is None else x[0] for x in res[nm][mode]])
for nm in res:
    for mode in ('loose', 'strict'):
        a, b = v(base, mode), v(nm, mode); ok = ~np.isnan(a) & ~np.isnan(b); d = b[ok] - a[ok]
        print(f"{nm:16s} {mode:6s} {b[ok].mean():.4f}  d_vs_{base} {d.mean():+.4f}±{d.std(ddof=1)/np.sqrt(ok.sum()):.4f} n={ok.sum()}")
