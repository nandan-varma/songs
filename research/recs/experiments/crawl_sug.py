import json, os, sys, time, urllib.request, threading, queue
import rdata

API = 'https://saavn-api.nandanvarma.com/api/songs/%s/suggestions?limit=30'
OUT = rdata.W + '/data/sug.jsonl'
NPL, NSEED, WORKERS = 700, 3, 3

def seeds():
    pls, _ = rdata.load()
    r = rdata.np.random.default_rng(5)
    pick = r.permutation(len(pls))[:NPL]
    return sorted({s for i in pick for s in rdata.perm(pls[i]['id'], pls[i]['songs'])[:NSEED]})

def fetch(sid):
    for k in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(API % sid, headers={'User-Agent': 'research-crawl'}), timeout=25) as r:
                d = json.load(r)
            return [dict(id=x['id'], title=x['name'], artists=[a['name'] for a in x['artists']['primary']], album=(x.get('album') or {}).get('name') or '',
                         album_id=(x.get('album') or {}).get('id') or '', label=x.get('label') or '', lang=(x.get('language') or '').lower(),
                         year=int(x.get('year') or 0), explicit=bool(x.get('explicitContent')), plays=int(x.get('playCount') or 0),
                         rel=x.get('releaseDate') or '') for x in d['data']]
        except Exception:
            time.sleep(2 * (k + 1))
    return None

def main():
    done = set()
    if os.path.exists(OUT):
        done = {json.loads(l)['seed'] for l in open(OUT)}
    todo = [s for s in seeds() if s not in done]
    q = queue.Queue()
    for s in todo: q.put(s)
    lock = threading.Lock()
    f = open(OUT, 'a')
    def work():
        while True:
            try: s = q.get_nowait()
            except queue.Empty: return
            res = fetch(s)
            if res is not None:
                with lock:
                    f.write(json.dumps(dict(seed=s, sug=res)) + '\n'); f.flush()
            time.sleep(0.2)
    ts = [threading.Thread(target=work) for _ in range(WORKERS)]
    [t.start() for t in ts]; [t.join() for t in ts]

if __name__ == '__main__':
    main()
