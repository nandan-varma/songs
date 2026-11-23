import json,time,urllib.request,urllib.parse,glob,collections,random,sys,os
B="https://saavn-api.nandanvarma.com"
N=0
def get(path,**q):
    global N
    N+=1; time.sleep(0.3)
    u=B+path+("?"+urllib.parse.urlencode(q) if q else "")
    for i in range(2):
        try:
            return json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"modes-feasibility/1.0"}),timeout=30).read())["data"]
        except Exception as e:
            err=e; time.sleep(1)
    return None
CAT_PATH = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("CATALOG_JSON")
if not CAT_PATH:
    sys.exit("usage: supply.py <catalog.json>   (or set CATALOG_JSON). The catalogue is in the archive bundle, not in the repo.")
S = os.environ.get("SUPPLY_DIR", ".")
cat = {i[0] for i in json.load(open(CAT_PATH))["items"]}
shipped=set(cat)
for p in glob.glob(f"{S}/data/playlists*.jsonl"):
    for l in open(p):
        for s in json.loads(l)['songs']: shipped.add(s['id'])
print("catalog",len(cat),"catalog+playlists",len(shipped))
LANGS="hindi english punjabi tamil telugu bengali marathi kannada malayalam gujarati".split()
songs={}
src=collections.defaultdict(lambda: collections.defaultdict(set))
def addsongs(lang,source,items):
    for s in items or []:
        if s.get('type')!='song': continue
        songs.setdefault(s['id'],s); src[lang][source].add(s['id'])
albums={}
for L in LANGS:
    addsongs(L,'trending',get("/api/trending",type="song",language=L))
    al=get("/api/trending",type="album",language=L) or []
    albums[L]=al
    for a in al[:3]:
        d=get("/api/albums",id=a['id'])
        if d: addsongs(L,'new_album_top3',d.get('songs') or [])
charts=get("/api/charts") or []
for c in charts:
    if c['id'] in ('1134543272','110858205','946682072'):
        d=get("/api/playlists",id=c['id'],limit=100)
        if d: addsongs('hindi','chart:'+c['name'],d.get('songs') or [])
chs=get("/api/channels") or []
print("channels",len(chs))
for c in chs[:6]:
    d=get(f"/api/channels/{c['id']}")
    if d:
        its=d.get('songs') or d.get('topSongs') or []
        for s in its:
            songs.setdefault(s['id'],s)
            lg=s.get('language') or 'other'
            src[lg]['channels'].add(s['id'])
        if c is chs[0]: print("channel keys",list(d.keys()))
rows=[]
for L in LANGS:
    tot=set().union(*src[L].values()) if src[L] else set()
    row=dict(lang=L,total=len(tot),new_vs_catalog=len(tot-cat),new_vs_shipped_all=len(tot-shipped),
        **{k:len(v) for k,v in src[L].items()})
    rows.append(row); print(row)
alls=set(songs); print("ALL distinct",len(alls),"not in catalog",len(alls-cat),"not in any playlist",len(alls-shipped))
print(collections.Counter(s.get('language') for s in songs.values()).most_common(12))
print("req so far",N)
rel=[s.get('releaseDate') for i,s in songs.items() if i not in cat]
print("new songs releaseDate>=2026-11-01:",sum(1 for r in rel if r and r>='2026-11-01'),"of",len(rel))
json.dump({"songs":songs,"rows":rows},open(f"{S}/exp3/B_supply.json","w"))
old=set()
for l in open(f"{S}/data/playlists_fresh.jsonl"):
    for s in json.loads(l)['songs']: old.add(s['id'])
print("old fresh crawl",len(old),"overlap with now",len(old&alls),"of now",len(alls))
random.seed(3)
pool=sorted(cat); samp=random.sample(pool,150)
ok=0;newc=0;tot=0;cnts=[];newsug={}
for i in samp:
    r=get(f"/api/songs/{i}/suggestions",limit=20)
    n=len(r) if isinstance(r,list) else 0
    cnts.append(n)
    if n>=5: ok+=1
    for s in (r or []):
        tot+=1
        if s['id'] not in cat: newc+=1; newsug[s['id']]=s
print("SUGG ok>=5",ok,"/150; mean n",sum(cnts)/150,"min",min(cnts),"total",tot,"new to catalog",newc,"distinct new",len(newsug),"req",N)
json.dump({"cnts":cnts,"newsug":newsug,"tot":tot,"newc":newc},open(f"{S}/exp3/B_sugg.json","w"))
