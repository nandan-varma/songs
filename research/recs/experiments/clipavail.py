import json,time,urllib.request,urllib.parse,statistics
UA={'User-Agent':'Mozilla/5.0 Chrome/134'}
D=json.load(open('B_detail.json'))['det']
def up(i):
    q=dict(__call='song.getDetails',_format='json',_marker='0',api_version='4',ctx='web6dot0',pids=i)
    return json.loads(urllib.request.urlopen(urllib.request.Request('https://www.jiosaavn.com/api.php?'+urllib.parse.urlencode(q),headers=UA),timeout=25).read())['songs'][0]
vl=[];rg=[];mi=[]
for s in D:
    time.sleep(0.3)
    try:
        u=up(s['id']); m=u['more_info']; v=m.get('vlink')
        mi.append(m)
    except Exception as e: v=None
    if v:
        t=time.time()
        try:
            b=urllib.request.urlopen(urllib.request.Request(v,headers=UA),timeout=30).read(); vl.append((len(b),time.time()-t))
        except Exception: vl.append((0,0))
    else: vl.append(None)
    dl={d['quality']:d['url'] for d in s['downloadUrl']}
    time.sleep(0.3);t=time.time()
    try:
        r=urllib.request.urlopen(urllib.request.Request(dl['96kbps'],headers={**UA,'Range':'bytes=0-199999'}),timeout=30);b=r.read();rg.append((r.status,len(b),time.time()-t,r.headers.get('Content-Range')))
    except Exception as e: rg.append((str(e)[:30],0,0,None))
okv=[x for x in vl if x and x[0]>5000]
print('vlink present',sum(1 for x in vl if x),'/60; downloaded ok',len(okv),'; median KB',statistics.median([x[0] for x in okv])/1e3,'; mean s',statistics.mean([x[1] for x in okv]))
print('Range 200KB of 96kbps: status',{r[0] for r in rg},'median bytes',statistics.median([r[1] for r in rg]),'mean s',statistics.mean([r[2] for r in rg]),'sample',rg[0])
print('more_info keys',sorted(mi[0].keys()))
for k in ['music','label','release_date','origin','is_dolby_content','encrypted_media_url','320kbps','has_lyrics','lyrics_snippet','starring','singers','lyricist','copyright_text','vcode','vlink']:
    print(k,sum(1 for m in mi if m.get(k)),'/',len(mi))
