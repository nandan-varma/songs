import os, sys, json, glob
for k in ('TF_NUM_INTRAOP_THREADS', 'TF_NUM_INTEROP_THREADS', 'OMP_NUM_THREADS'): os.environ[k] = '1'
import numpy as np
import analyze2 as A
shard, total = int(sys.argv[1]), int(sys.argv[2])
done = set()
for f in glob.glob('data/feat2_*.npy') + glob.glob('data/feat3_*.npy'): done |= set(np.load(f, allow_pickle=True).item())
have = {os.path.basename(f)[:-4] for f in glob.glob('data/clips/*.mp3')}
hot = {}
for l in open('data/playlists_fresh.jsonl'):
    p = json.loads(l); n = len(p['songs'])
    for r, s in enumerate(p['songs']): hot[s['id']] = max(hot.get(s['id'], 0), 1 - r / n)
prio = [i for i, _ in sorted(hot.items(), key=lambda kv: -kv[1])] + json.load(open('data/want_ids.json'))
order = [i for i in dict.fromkeys(prio) if i in have and i not in done]
mine = order[shard::total]
ck = f'data/feat3_{shard}.npy'; res = np.load(ck, allow_pickle=True).item() if os.path.exists(ck) else {}
print('todo', len(mine), 'of', len(order), flush=True)
for n, i in enumerate(mine):
    if i in res: continue
    try: res[i] = A.feat(f'data/clips/{i}.mp3')
    except Exception as e: print('fail', i, e, flush=True)
    if n % 100 == 0: np.save(ck, res, allow_pickle=True); print('progress', shard, n, len(mine), flush=True)
np.save(ck, res, allow_pickle=True); print('DONE', shard, len(res), flush=True)
