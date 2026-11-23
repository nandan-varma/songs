import os, re, json, html, hashlib, collections, numpy as np

W = os.path.abspath(os.environ.get('RECS_WORK') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.work'))
STOP = set('the a an of in on to and from with for is me my you your i we it at by song songs'.split())
LANGS = ['hindi', 'telugu', 'tamil', 'punjabi', 'kannada', 'bengali', 'marathi', 'malayalam', 'english', 'bhojpuri', 'gujarati', 'haryanvi']

def clean(x):
    return html.unescape(x or '')

def norm_song(s):
    arts = [clean(n) for _, n in (s.get('artists') or [])] or [clean(s.get('music') or '')]
    try:
        year = int(s.get('year') or 0)
    except ValueError:
        year = 0
    return dict(id=s['id'], title=clean(s.get('title')), artists=arts, composer=clean(s.get('music')), album=clean(s.get('album')),
                album_id=s.get('album_id') or '', label=clean(s.get('label')), lang=(s.get('lang') or '').lower(), year=year,
                explicit=s.get('expl') == '1', plays=int(s.get('plays') or 0), rel=s.get('rel') or '')

def load():
    pls, songs = [], {}
    for fn in ('playlists', 'playlists_instr', 'playlists_fresh'):
        for l in open(f'{W}/data/{fn}.jsonl'):
            p = json.loads(l)
            ids = []
            for s in p['songs']:
                if s['id'] not in songs:
                    songs[s['id']] = norm_song(s)
                ids.append(s['id'])
            ids = list(dict.fromkeys(ids))
            if len(ids) >= 8:
                pls.append(dict(id=p['id'], title=p['title'], src=fn, songs=ids))
    seen, uniq = set(), []
    for p in pls:
        k = tuple(sorted(p['songs']))
        if k not in seen:
            seen.add(k)
            uniq.append(p)
    return uniq, songs

def perm(pid, ids):
    return sorted(ids, key=lambda s: hashlib.md5((pid + s).encode()).hexdigest())

def artist_names(s):
    return [n.strip().lower() for n in re.split(r'[,&]', ', '.join(s['artists'])) if n.strip()]

def primary(s):
    return (', '.join(s['artists']).split(',')[0].strip().lower()) if s['artists'] else ''

def title_words(s):
    return [w for w in re.split(r'[^0-9A-Za-z\u00c0-\uffff]+', s['title'].lower()) if len(w) >= 2]

def tokens(s):
    t = [('a|' + a, 0.5) for a in artist_names(s)]
    for m in s['composer'].split(','):
        m = m.strip().lower()
        if m: t.append(('m|' + m, 0.25))
    if s['album']: t.append(('al|' + s['album'].lower(), 1.0))
    if s['label']: t.append(('lb|' + s['label'].lower(), 0.5))
    if s['lang']: t.append(('lg|' + s['lang'], 0.5))
    if s['year'] > 0:
        t.append(('y|%d' % s['year'], 0.25)); t.append(('d|%d' % (s['year'] // 5 * 5), 0.5))
    if s['artists'] and s['lang']:
        t.append(('x|%s|%s' % (primary(s), s['lang']), 0.5))
    for w in title_words(s): t.append(('w|' + w, 0.5))
    if s['explicit']: t.append(('e|explicit', 0.1))
    return t

def folds(pls, k=4, seed=11):
    r = np.random.default_rng(seed)
    order = r.permutation(len(pls))
    f = np.empty(len(pls), int)
    f[order] = np.arange(len(pls)) % k
    return f
