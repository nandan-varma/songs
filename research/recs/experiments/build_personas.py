import os, sys, json, pickle, numpy as np, rlib, enc, personas, rdata
from concurrent.futures import ProcessPoolExecutor

TAG = sys.argv[1] if len(sys.argv) > 1 else ''
KW = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
OUT = rdata.W + '/personas' + (('_' + TAG) if TAG else '')
os.makedirs(OUT, exist_ok=True)

def one(args):
    lang, theme = args
    fn = f'{OUT}/{lang}_{theme}.npz'
    if os.path.exists(fn): return fn
    w = rlib.World()
    p = personas.persona(w, lang, theme)
    hold = set(p['pls'])
    tr = [q for pi, q in enumerate(w.P) if pi not in hold]
    v = enc.Vocab(w, sorted({i for q in tr for i in q}))
    _, E = enc.train(w, v, tr, **{'dim': 64, 'steps': 1500, **KW})
    np.savez(fn, E=E.astype(np.float32), songs=p['songs'], pls=np.array(p['pls']))
    return fn

if __name__ == '__main__':
    jobs = pickle.load(open(rdata.W + '/personas/jobs.pkl', 'rb'))
    pickle.dump(jobs, open(OUT + '/jobs.pkl', 'wb'))
    sel = jobs if os.environ.get('ALL') else jobs[::2]
    with ProcessPoolExecutor(5) as ex:
        for fn in ex.map(one, sel): pass
    print('done', OUT)
