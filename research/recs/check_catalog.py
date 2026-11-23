"""Headless playability check for the bundled catalog: do sampled songs resolve to audio + artwork via the API?

usage: check_catalog.py <catalog.json> [sample size] [api base]
"""
import json, random, sys, urllib.request, urllib.parse
meta = json.load(open(sys.argv[1]))
n = int(sys.argv[2]) if len(sys.argv) > 2 else 200
base = sys.argv[3] if len(sys.argv) > 3 else 'https://saavn-api.nandanvarma.com'
random.seed(1)
ids = [it[0] for it in random.sample(meta['items'], min(n, len(meta['items'])))]
ok = noimg = 0; urls = []
for i in range(0, len(ids), 20):
    chunk = ids[i:i + 20]
    try:
        d = json.loads(urllib.request.urlopen(base + '/api/songs?' + urllib.parse.urlencode({'ids': ','.join(chunk)}), timeout=30).read())['data']
    except Exception as e:
        print('batch failed', e); continue
    for s in d:
        links = s.get('downloadUrl') or []
        if links: ok += 1; urls.append(links[min(3, len(links) - 1)]['url'])
        if not s.get('image'): noimg += 1
print(f'resolved with audio: {ok}/{len(ids)} ({ok / len(ids):.0%}), without image: {noimg}')
reach = 0
for u in random.sample(urls, min(10, len(urls))):
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, method='HEAD'), timeout=20); reach += r.status == 200
    except Exception as e: print('HEAD failed', u[:70], e)
print(f'audio URLs reachable (HEAD): {reach}/{min(10, len(urls))}')
