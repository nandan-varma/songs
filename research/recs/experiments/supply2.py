import json,time,urllib.request,urllib.parse,random,collections,datetime,os,statistics
S="/private/tmp/claude-501/-Users-nandan-dev-web-music-music-api/0c615e2d-e85f-41eb-99bc-164d1e551c62/scratchpad"
B="https://saavn-api.nandanvarma.com"
cat={i[0] for i in json.load(open("/Users/nandan/dev/web/music/music-api/ios/Modes/Modes/Resources/catalog.json"))["items"]}
sup=json.load(open(f"{S}/exp3/B_supply.json")); sg=json.load(open(f"{S}/exp3/B_sugg.json"))
songs=sup['songs']
today=datetime.date(2026,11,22)
def age(s):
    try: return (today-datetime.date.fromisoformat(s['releaseDate'])).days
    except: return None
print("today's list: release age (days) of songs by group")
for name,grp in [('all today',songs.values()),('today not-in-catalog',[s for i,s in songs.items() if i not in cat])]:
    a=[age(s) for s in grp if age(s) is not None]
    print(name,len(a),'<=7d',sum(x<=7 for x in a),'<=30d',sum(x<=30 for x in a),'<=90d',sum(x<=90 for x in a),'<=365d',sum(x<=365 for x in a),'median days',statistics.median(a))
# per-language age <=90d
by=collections.defaultdict(list)
for s in songs.values(): by[s['language']].append(s)
for L,v in by.items():
    a=[age(s) for s in v if age(s) is not None]
    print(L,len(v),'<=30d',sum(x<=30 for x in a),'<=90d',sum(x<=90 for x in a),'in-catalog',sum(s['id'] in cat for s in v))
# has downloadUrl in list responses?
print('list item keys sample',sorted(next(iter(songs.values())).keys()))
print('fraction with downloadUrl in list items',sum(bool(s.get('downloadUrl')) for s in songs.values())/len(songs))
# suggestions
import numpy as np
c=np.array(sg['cnts']);print('sugg counts: >=5',(c>=5).sum(),'zero',(c==0).sum(),'median',np.median(c),'new frac',sg['newc']/sg['tot'])
na=[age(s) for s in sg['newsug'].values() if age(s) is not None]
print('suggested new songs age: <=90d',sum(x<=90 for x in na),'<=365',sum(x<=365 for x in na),'median',statistics.median(na),'n',len(na))
print('lang of new sugg',collections.Counter(s['language'] for s in sg['newsug'].values()).most_common(8))
# (3) sample 60 outside-catalog songs
random.seed(5)
pool=[s for s in list(songs.values())+list(sg['newsug'].values()) if s['id'] not in cat]
pool={s['id']:s for s in pool}
samp=random.sample(sorted(pool),60)
N=0
def get(path,**q):
    global N; N+=1; time.sleep(0.3)
    return json.loads(urllib.request.urlopen(urllib.request.Request(B+path+"?"+urllib.parse.urlencode(q),headers={"User-Agent":"modes-feasibility/1.0"}),timeout=30).read())["data"]
det=[]
for i in range(0,60,20):
    det+=get("/api/songs",ids=",".join(samp[i:i+20]))
print('detail fetched',len(det),'req',N)
print('detail keys',sorted(det[0].keys()),'artist roles',collections.Counter(a.get('role') for s in det for a in s['artists']['primary']+s['artists'].get('featured',[])+s['artists'].get('all',[])).most_common(10))
print('artist groups keys',list(det[0]['artists'].keys()))
fields=['name','year','releaseDate','duration','label','language','playCount','copyright','album','hasLyrics','explicitContent']
for f in fields: print(f,'present',sum(bool(s.get(f)) for s in det),'/',len(det))
print('primary artists present',sum(bool(s['artists']['primary']) for s in det),'all present',sum(bool(s['artists']['all']) for s in det))
roles=collections.Counter(a.get('role') for s in det for a in s['artists']['all']); print('roles in all',roles)
print('composer role present',sum(any(a.get('role')=='music' for a in s['artists']['all']) for s in det))
print('playCount median',statistics.median([s['playCount'] or 0 for s in det]))
# preview availability: download 'q' variants
res=[];sizes={}
for s in det:
    dl={d['quality']:d['url'] for d in s.get('downloadUrl') or []}
    if not dl: res.append((s['id'],None,0,0,'nourl'));continue
    url=dl.get('96kbps') or list(dl.values())[0]
    N+=1;time.sleep(0.3);t=time.time()
    try:
        r=urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"}),timeout=40);b=r.read();res.append((s['id'],url,len(b),time.time()-t,r.status))
    except Exception as e: res.append((s['id'],url,0,time.time()-t,str(e)[:40]))
ok=[r for r in res if r[2]>0]
print('full-track 96kbps download ok',len(ok),'/60; size MB median',statistics.median([r[2] for r in ok])/1e6,'; mean time s',statistics.mean([r[3] for r in ok]))
print('failures',[r[4] for r in res if r[2]==0][:10])
print('qualities available',collections.Counter(tuple(d['quality'] for d in s.get('downloadUrl') or []) for s in det).most_common(3))
print('req total this script',N)
json.dump({'det':det,'res':res},open(f"{S}/exp3/B_detail.json","w"))
