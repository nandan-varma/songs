import sys, json, pickle, argparse, numpy as np, scipy.sparse as sp
from concurrent.futures import ProcessPoolExecutor
import rlib, plib, rdata

ap = argparse.ArgumentParser()
ap.add_argument('--variants', required=True)
ap.add_argument('--split', default='tune')
ap.add_argument('--reps', type=int, default=3)
ap.add_argument('--rounds', type=int, default=10)
ap.add_argument('--out', default='')
a = ap.parse_args()
SEEDS = [1, 3, 5, 10, 20]
import os
OUT = rdata.W + '/personas' + os.environ.get('ETAG', '')

VARIANTS = {
    'A': dict(kind='A'),
    'shipped': dict(kind='diag', scale=0.5),
    'diag1': dict(kind='diag', scale=1.0),
    'diag2': dict(kind='diag', scale=2.0),
    'wide': dict(kind='wide', beta=1.0),
    'wide_cent': dict(kind='wide', beta=1.0, centroid=1.0),
    'cent_only': dict(kind='wide', beta=0.0, centroid=1.0),
    'diag1_cent': dict(kind='diag', scale=1.0, wide=True, centroid=1.0, beta=0.0),
}
VARIANTS.update(json.load(open(a.variants)) if a.variants.endswith('.json') else {})

def maker(w, v, E):
    X = w.X
    k = v['kind']
    if k == 'A': return lambda: plib.Learner(X, prior=v.get('prior', 1.0), temp=v.get('temp', 0.04))
    if k == 'diagpu':
        POPN = np.log1p(np.array([w.songs[s]['plays'] for s in w.ids], float)); POPN = ((POPN - POPN.mean()) / POPN.std()).astype(np.float32)
        cols = [X, sp.csr_matrix((v.get('scale', 0.5) * E).astype(np.float32))]
        if v.get('pop'): cols.append(sp.csr_matrix(POPN[:, None] * v['pop']))
        Xc = sp.hstack(cols).tocsr(); pool = np.where(w.lang == v['lang'])[0]
        return lambda: plib.Learner(Xc, prior=v.get('prior', 1.0), temp=v.get('temp', 0.04), pool=pool, pu_k=v.get('k', 3), pu_w=v.get('w', 0.1))
    if k == 'diag':
        Xc = sp.hstack([X, sp.csr_matrix((v['scale'] * E).astype(np.float32))]).tocsr()
        if v.get('wide'): return lambda: plib.Learner(Xc, prior=v.get('prior', 1.0), temp=v.get('temp', 0.04), wide=E, beta=v.get('beta', 0.0), centroid=v.get('centroid', 0.0))
        return lambda: plib.Learner(Xc, prior=v.get('prior', 1.0), temp=v.get('temp', 0.04))
    return lambda: plib.Learner(X, prior=v.get('prior', 1.0), temp=v.get('temp', 0.04), wide=E, beta=v.get('beta', 1.0), centroid=v.get('centroid', 0.0))

POP = None
def maker_lr(w, v, E, lang, rng, theme=None):
    global POP
    if POP is None:
        POP = np.log1p(np.array([w.songs[s]['plays'] for s in w.ids], float)); POP = (POP - POP.mean()) / POP.std()
    parts = [w.X]
    if v.get('dense', 1.0): parts.append(sp.csr_matrix((v.get('dense', 1.0) * E).astype(np.float32)))
    if v.get('pop'): parts.append(sp.csr_matrix(POP[:, None].astype(np.float32) * v['pop']))
    if v.get('arch'):
        A = np.load(f'{OUT}/arch_{lang}_{theme}.npy')
        keys = pickle.load(open(f'{OUT}/arch_{lang}_{theme}.keys', 'rb'))
        keep = [k for k, (sc, t) in enumerate(keys) if (sc == lang and v.get('own', True)) or (sc == '*' and v.get('glob', True))]
        A = A[:, keep]
        pl = np.where(w.lang == lang)[0]
        A = (A - A[pl].mean(0)) / (A[pl].std(0) + 1e-6)
        parts.append(sp.csr_matrix((v['arch'] * A).astype(np.float32)))
    F = sp.hstack(parts).tocsr()
    pool_all = np.where(w.lang == lang)[0]
    return lambda: plib.LR(F, pool_all, C=v.get('C', 1.0), neg=v.get('neg', 60), negw=v.get('negw', 0.1), temp=v.get('temp', 0.0), rng=np.random.default_rng(hash(lang) % 1000 + 1), fixneg=v.get('fixneg', False))

W = None
def init():
    global W
    W = rlib.World()

def job(args):
    lang, theme, names, reps, rounds = args
    d = np.load(f'{OUT}/{lang}_{theme}.npz')
    E = d['E']
    p = dict(lang=lang, theme=theme, songs=d['songs'])
    member, liked = plib.taste(W, p, hash((lang, theme)) % 100000)
    base = member[W.lang == lang].mean()
    res = {}
    for nm in names:
        v = VARIANTS[nm]
        plib.CAP = v.get('cap', 2); plib.CONSEC = v.get('consec', True)
        v = dict(v, lang=lang)
        mk = maker_lr(W, v, E, lang, np.random.default_rng(5), theme) if v['kind'] == 'lr' else maker(W, v, E)
        arr = np.zeros((len(SEEDS), reps, rounds, 2))
        for si, ns in enumerate(SEEDS):
            for r in range(reps):
                rng = np.random.default_rng(1000 * si + r)
                f, l = plib.run(W, mk, p, ns, rounds, rng, member, liked)
                arr[si, r, :, 0] = f; arr[si, r, :, 1] = l
        res[nm] = arr.mean(1)
    return lang, theme, base, res

if __name__ == '__main__':
    jobs = pickle.load(open(OUT + '/jobs.pkl', 'rb'))
    sel = [j for k, j in enumerate(jobs) if (k % 2 == 0) == (a.split == 'tune')] if a.split in ('tune', 'val') else jobs
    names = a.variants.split(',') if not a.variants.endswith('.json') else list(json.load(open(a.variants)))
    with ProcessPoolExecutor(6, initializer=init) as ex:
        out = list(ex.map(job, [(l, t, names, a.reps, a.rounds) for l, t in sel]))
    if a.out: pickle.dump(out, open(a.out, 'wb'))
    print(f'split={a.split} personas={len(out)} base fit {np.mean([o[2] for o in out]):.3f}')
    print(f'{"variant":16s} ' + ' '.join(f'seed{n:<2d}(r1/r5/r10)' for n in SEEDS) + '   mean-fit  lift')
    for nm in names:
        cells = []
        for si in range(len(SEEDS)):
            m = np.mean([o[3][nm][si, :, 0] for o in out], axis=0)
            cells.append(f'{m[0]:.2f}/{m[4]:.2f}/{m[-1]:.2f}   ')
        allm = np.mean([o[3][nm][:, :, 0].mean() for o in out])
        lift = np.mean([o[3][nm][:, :, 0].mean() / o[2] for o in out])
        print(f'{nm:16s} ' + ' '.join(cells) + f'  {allm:.3f}  {lift:.2f}x')
