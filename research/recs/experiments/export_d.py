import json, os, numpy as np
import rlib, enc, rdata

w = rlib.World()
v = enc.Vocab(w, range(w.N))
m, E = enc.train(w, v, w.P, dim=64, steps=1500)
out = rdata.W + '/d_export'
os.makedirs(out, exist_ok=True)
table = m.emb.weight.detach().cpu().numpy()[1:].astype(np.float16)
table.tofile(out + '/table_fp16.bin')
toks = sorted(v.t2i, key=v.t2i.get)
W_KIND = dict(a=0.5, m=0.25, al=1.0, lb=0.5, lg=0.5, y=0.25, d=0.5, x=0.5, w=0.5, e=0.1)
json.dump(dict(dim=64, count=len(toks), scale=0.5, tokens=toks, weights=W_KIND), open(out + '/vocab.json', 'w'), ensure_ascii=False)
index = {t: i for i, t in enumerate(toks)}

def vector(tokens):
    acc = np.zeros(64, np.float32); tot = np.float32(0)
    for t, wt in tokens:
        if t in index:
            acc += np.float32(wt) * table[index[t]].astype(np.float32); tot += np.float32(wt)
    if tot == 0: return np.zeros(64, np.float32)
    acc /= tot
    n = np.sqrt((acc * acc).sum())
    return (acc / n * np.float32(0.5)).astype(np.float32) if n > 1e-12 else np.zeros(64, np.float32)

def fields(s):
    return dict(id=s['id'], title=s['title'], artist=rdata.app_artist_line(s), album=s['album'], albumID=s['album_id'] or None,
                label=s['label'], language=s['lang'], year=s['year'], artistIDs=[], composer='', explicit=s['explicit'])

rng = np.random.default_rng(3)
picked = []
for lg in ['hindi', 'telugu', 'tamil', 'punjabi', 'kannada', 'bengali', 'marathi', 'malayalam', 'english', 'bhojpuri', 'gujarati', 'haryanvi']:
    ids = [s for s in w.ids if w.songs[s]['lang'] == lg]
    for s in rng.choice(ids, 2, replace=False): picked.append(fields(w.songs[s]))
picked = picked[:18]
extra = [
    dict(id='g_noalbum', title='Chaand Baaliyan', artist='Aditya A', album='', albumID=None, label='', language='hindi', year=2022, artistIDs=[], composer='', explicit=False),
    dict(id='g_noyear', title='Kesariya Tera', artist='Arijit Singh, Shilpa Rao', album='Brahmastra', albumID='1', label='Sony Music', language='hindi', year=0, artistIDs=[], composer='', explicit=False),
    dict(id='g_nolang', title='Instrumental Flow', artist='Ludovico Einaudi', album='Seven Days Walking', albumID='2', label='Decca', language='', year=2019, artistIDs=[], composer='', explicit=False),
    dict(id='g_unicode_dev', title='तुम ही हो (From "Aashiqui 2")', artist='Mithoon & Arijit Singh', album='Aashiqui 2', albumID='3', label='T-Series', language='hindi', year=2013, artistIDs=[], composer='', explicit=False),
    dict(id='g_unicode_ta', title='என்னோடு நீ இருந்தால்', artist='A.R. Rahman', album='I', albumID='4', label='Sony Music', language='tamil', year=2015, artistIDs=[], composer='', explicit=False),
    dict(id='g_accent', title='Café del Mar – Ñandú Été', artist='José González, Zoé', album='Café', albumID='5', label='Mélodie', language='english', year=2008, artistIDs=[], composer='', explicit=True),
    dict(id='g_emoji', title='Fire 🔥🔥 X 2 Go', artist='  Drake ,  ', album='Her Loss', albumID='6', label='OVO', language='English', year=2022, artistIDs=[], composer='', explicit=True),
    dict(id='g_composer', title='Maa', artist='Shreya Ghoshal', album='Maa', albumID='7', label='Zee', language='bengali', year=2011, artistIDs=[], composer='A.R. Rahman, Pritam ', explicit=False),
    dict(id='g_dupwords', title='Dil Dil Dil (Dil Se)', artist='Sukhwinder Singh', album='Dil Se', albumID='8', label='Venus', language='hindi', year=1998, artistIDs=[], composer='', explicit=False),
    dict(id='g_unknown_only', title='Qzxvw Zzyq', artist='Zzyzx Qwv', album='', albumID=None, label='', language='', year=0, artistIDs=[], composer='', explicit=False),
    dict(id='g_empty', title='', artist='', album='', albumID=None, label='', language='', year=0, artistIDs=[], composer='', explicit=False),
    dict(id='g_shortwords', title='A I O U', artist='X', album='', albumID=None, label='', language='hindi', year=0, artistIDs=[], composer='', explicit=False),
]
songs = [dict(f, duration=0.0, playCount=0) for f in picked + extra]
golden = []
for f in songs:
    tk = rdata.tokens_from_fields(f['title'], f['artist'], f['album'], f['label'], f['language'], f['year'], f['composer'], f['explicit'])
    known = [t for t, _ in tk if t in index]
    vec = vector(tk)
    golden.append(dict(song=f, tokens=[[t, wt] for t, wt in tk], knownTokens=len(known), vector=[round(float(x), 6) for x in vec]))
json.dump(dict(dim=64, count=len(golden), songs=golden), open(out + '/golden.json', 'w'), ensure_ascii=False, indent=1)
zero = [g['song']['id'] for g in golden if not any(g['vector'])]
print('tokens', len(toks), 'zero-vector golden', zero, 'golden', len(golden))
for p in ('table_fp16.bin', 'vocab.json', 'golden.json'): print(p, os.path.getsize(out + '/' + p))
