import json, os, numpy as np, torch
import rlib, enc, rdata

w = rlib.World()
v = enc.Vocab(w, range(w.N))
m, E = enc.train(w, v, w.P, dim=64, steps=1500)
out = rdata.W + '/d_export'
os.makedirs(out, exist_ok=True)
table = m.emb.weight.detach().cpu().numpy().astype(np.float16)
table.tofile(out + '/table_fp16.bin')
toks = sorted(v.t2i, key=v.t2i.get)
json.dump(dict(dim=64, tokens=toks, weights=dict(a=0.5, m=0.25, al=1.0, lb=0.5, lg=0.5, y=0.25, d=0.5, x=0.5, w=0.5, e=0.1)), open(out + '/vocab.json', 'w'))
print('tokens', len(toks), 'table bytes', table.nbytes, 'vocab json bytes', os.path.getsize(out + '/vocab.json'))
kinds = {}
for t in toks: kinds[t.split('|')[0]] = kinds.get(t.split('|')[0], 0) + 1
print(kinds)
