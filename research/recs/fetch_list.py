import json,os,sys,urllib.request,urllib.parse,time
from concurrent.futures import ThreadPoolExecutor
ids=json.load(open('data/want_ids.json')); shard,total=int(sys.argv[1]),int(sys.argv[2]); ids=[i for n,i in enumerate(ids) if n%total==shard]
UA={'User-Agent':'Mozilla/5.0 Chrome/134'}
def get(u,raw=False):
    for i in range(3):
        try:
            d=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=25).read(); return d if raw else json.loads(d)
        except Exception: time.sleep(1+i)
def one(i):
    f=f'data/clips/{i}.mp3'
    if os.path.exists(f): return 1
    d=get('https://www.jiosaavn.com/api.php?'+urllib.parse.urlencode(dict(__call='song.getDetails',_format='json',_marker='0',api_version='4',ctx='web6dot0',pids=i)))
    try: v=d['songs'][0]['more_info'].get('vlink')
    except Exception: v=None
    if not v: return 0
    b=get(v,raw=True)
    if b and len(b)>5000: open(f,'wb').write(b); return 1
    return 0
n=0
with ThreadPoolExecutor(8) as ex:
    for k,r in enumerate(ex.map(one,ids)):
        n+=r
        if k%300==0: print(shard,k,n,flush=True)
print('DONE',shard,n,'of',len(ids),flush=True)
