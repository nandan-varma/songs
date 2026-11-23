import json, os, time, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/134.0.0.0 Safari/537.36"
LANGS = ['hindi','english','punjabi','tamil','telugu','bengali','marathi','kannada','malayalam','gujarati','bhojpuri','haryanvi']
def call(c, lang, **p):
    q = dict(__call=c, _format='json', _marker='0', api_version='4', ctx='web6dot0', **p)
    for i in range(3):
        try:
            r = urllib.request.urlopen(urllib.request.Request('https://www.jiosaavn.com/api.php?' + urllib.parse.urlencode(q), headers={'User-Agent': UA, 'Cookie': 'L=' + lang}), timeout=25)
            return json.loads(r.read().decode())
        except Exception: time.sleep(1.5 * (i + 1))
def song(s):
    if s.get('type') != 'song': return None
    mi = s.get('more_info') or {}; am = mi.get('artistMap') or {}
    return dict(id=s['id'], title=s.get('title'), lang=s.get('language'), year=s.get('year'), album=mi.get('album'), album_id=mi.get('album_id'),
                label=mi.get('label'), music=mi.get('music'), dur=mi.get('duration'), plays=s.get('play_count'), rel=mi.get('release_date'), expl=s.get('explicit_content'),
                img=s.get('image'), artists=[(a['id'], a['name']) for a in (am.get('primary_artists') or [])], feat=[(a['id'], a['name']) for a in (am.get('featured_artists') or [])])
def playlist(i, lang): return call('playlist.getDetails', lang, listid=i, n=100, p=1)
def album(i, lang): return call('content.getAlbumDetails', lang, albumid=i)
def work(lang):
    out = []
    def add(kind, pid, title, items):
        ss = [x for x in (song(s) for s in items or []) if x]
        if len(ss) >= 5: out.append(dict(id=f'fresh:{kind}:{lang}:{pid}', title=title, q=f'fresh:{kind}:{lang}', fans=None, n=len(ss), songs=ss))
    for ch in call('content.getCharts', lang) or []:
        r = playlist(ch['id'], lang)
        if r: add('chart', ch['id'], r.get('title', ''), r.get('list'))
    add('trending', 'song', f'Trending {lang}', call('content.getTrending', lang, entity_type='song', entity_language=lang))
    ld = call('webapi.getLaunchData', lang) or {}
    add('new', 'songs', f'New {lang}', [s for s in ld.get('new_albums', []) if s.get('type') == 'song'])
    for a in [s for s in ld.get('new_albums', []) + ld.get('new_trending', []) if s.get('type') == 'album'][:12]:
        r = album(a['id'], lang)
        if r: add('newalbum', a['id'], r.get('title', ''), r.get('list'))
    for p in (ld.get('top_playlists') or [])[:12]:
        r = playlist(p['id'], lang)
        if r: add('top', p['id'], r.get('title', ''), r.get('list'))
    ids = [s['id'] for s in call('content.getTrending', lang, entity_type='song', entity_language=lang) or []]
    return out
with ThreadPoolExecutor(4) as ex: res = list(ex.map(work, LANGS))
rows = [r for rr in res for r in rr]
with open('data/playlists_fresh.jsonl', 'w') as f:
    for r in rows: f.write(json.dumps(r) + '\n')
songs = {s['id'] for r in rows for s in r['songs']}
print('fresh lists', len(rows), 'unique songs', len(songs))
