import json, numpy as np, scipy.sparse as sp, collections
import rlib, rdata, cold_eval as ce

w = rlib.World()
sug = {}
for l in open(rdata.W + '/data/sug.jsonl'):
    d = json.loads(l); sug[d['seed']] = d['sug']
extra = {}
for v in sug.values():
    for s in v:
        if s['id'] not in w.ix and s['id'] not in extra:
            extra[s['id']] = dict(id=s['id'], title=s['title'], artists=s['artists'], composer='', album=s['album'], album_id=s['album_id'],
                                  label=s['label'], lang=s['lang'], year=s['year'], explicit=s['explicit'], plays=s['plays'], rel=s['rel'])
eids = sorted(extra)
allids = w.ids + eids
songs = dict(w.songs); songs.update(extra)
songs = {k: dict(v, composer='') for k, v in songs.items()}
X = rlib.hashed(songs, allids)
ix = {s: i for i, s in enumerate(allids)}
lang = np.array([songs[s]['lang'] for s in allids])
plays = np.array([songs[s]['plays'] for s in allids])
anames = [set(rdata.artist_names(songs[s])) for s in allids]
print('extra songs', len(eids), 'seeds with sug', len(sug))

def zs(x):
    return (x - x.mean()) / (x.std() + 1e-9)

rng = np.random.default_rng(0)
rows = []
for pi, p in enumerate(w.pls):
    order = w.seedorder[pi]; seeds = order[:3]
    ssid = [w.ids[i] for i in seeds]
    if not all(s in sug for s in ssid): continue
    rest = {w.ids[i] for i in order[3:]}
    if len(rest) < 3: continue
    src = collections.defaultdict(float); cnt = collections.defaultdict(int)
    for s in ssid:
        for r, c in enumerate(sug[s]):
            src[c['id']] += 1.0 / (1 + r / 5.0); cnt[c['id']] += 1
    cand = set(src) - set(ssid)
    pl = collections.Counter(lang[ix[s]] for s in ssid).most_common(1)[0][0]
    pop = np.where((lang == pl))[0]
    pop = pop[np.argsort(-plays[pop])[:2000]]
    bg = [allids[i] for i in rng.choice(pop, min(200, len(pop)), replace=False)]
    cand |= {b for b in bg if b not in ssid}
    cand = sorted(cand)
    ci = np.array([ix[c] for c in cand])
    rel = np.array([c in rest for c in cand])
    if rel.sum() < 1: continue
    sidx = [ix[s] for s in ssid]
    r = rlib.Ridge(rlib.DIM)
    for s in sidx: r.observe(X[s], 1.0, 1.0)
    sA = X[ci] @ r.mean_w()
    sS = np.array([src.get(c, 0.0) for c in cand])
    sC = np.array([cnt.get(c, 0) for c in cand], float)
    arts = set().union(*[anames[s] for s in sidx])
    conf = np.array([bool(anames[i] & arts) for i in ci])
    rows.append(dict(sA=sA, sS=sS, sC=sC, rel=rel, conf=conf, insug=np.array([c in src for c in cand]), idx=len(rows)))
print('playlists', len(rows), 'cands/pl', np.mean([len(r['rel']) for r in rows]))
print('P(rel|from suggestions)', np.mean(np.concatenate([r['rel'][r['insug']] for r in rows])), 'P(rel|background only)', np.mean(np.concatenate([r['rel'][~r['insug']] for r in rows])))
variants = {'A': lambda r: r['sA'], 'src_only': lambda r: r['sS']}
for b in (0.1, 0.25, 0.5, 1, 2): variants[f'A+{b}*src'] = (lambda b: lambda r: zs(r['sA']) + b * zs(r['sS']))(b)
for b in (0.25, 0.5, 1): variants[f'A+{b}*count'] = (lambda b: lambda r: zs(r['sA']) + b * zs(r['sC']))(b)
for b in (0.5, 1): variants[f'A+{b}*insug'] = (lambda b: lambda r: zs(r['sA']) + b * (r['insug'] * 1.0))(b)
out = {}
for nm, fn in variants.items():
    for mode in ('loose', 'strict'):
        v = []
        for r in rows:
            keep = np.ones(len(r['rel']), bool) if mode == 'loose' else ~r['conf']
            if r['rel'][keep].sum() < 1: continue
            v.append(rlib.ndcg_recall(fn(r)[keep], r['rel'][keep]))
        out[(nm, mode)] = np.array(v)
    L, S = out[(nm, 'loose')], out[(nm, 'strict')]
    print(f"{nm:14s} loose {rlib.mean_se(L[:,0])[0]:.4f}±{rlib.mean_se(L[:,0])[1]:.4f} | strict {rlib.mean_se(S[:,0])[0]:.4f}±{rlib.mean_se(S[:,0])[1]:.4f} n={len(S)}")

A0 = out[('A', 'strict')][:, 0]
for nm in variants:
    d = out[(nm, 'strict')][:, 0] - A0
    print(f"paired strict d_vs_A {nm:14s} {d.mean():+.4f}±{d.std(ddof=1)/np.sqrt(len(d)):.4f}")
