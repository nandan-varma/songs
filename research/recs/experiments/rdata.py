import os, re, json, html, hashlib, collections, numpy as np, regex

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
    return dict(id=s['id'], title=clean(s.get('title')), artists=arts, composer='', album=clean(s.get('album')),
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

def app_artist_line(s):
    return ', '.join(s['artists'][:2])

def split_names(line):
    return [n.strip(' \t').lower() for n in re.split(r'[,&]', line) if n.strip(' \t')]

def artist_names(s):
    return split_names(app_artist_line(s))

def all_artist_names(s):
    return set(split_names(', '.join(s['artists'])))

def primary(s):
    line = app_artist_line(s)
    return line.split(',')[0].strip(' \t').lower() if line else ''

def words(title):
    return [w for w in regex.split(r'[^\p{L}\p{M}\p{N}]+', title.lower()) if len(regex.findall(r'\X', w)) >= 2]

def title_words(s):
    return words(s['title'])

def tokens_from_fields(title, artist, album, label, language, year, composer, explicit):
    names = split_names(artist)
    t = [('a|' + n, 0.5) for n in names]
    for m in composer.split(','):
        m = m.strip(' \t').lower()
        if m: t.append(('m|' + m, 0.25))
    if album: t.append(('al|' + album.lower(), 1.0))
    if label: t.append(('lb|' + label.lower(), 0.5))
    if language: t.append(('lg|' + language.lower(), 0.5))
    if year > 0:
        t.append(('y|%d' % year, 0.25)); t.append(('d|%d' % (year // 5 * 5), 0.5))
    if names and language:
        t.append(('x|%s|%s' % (names[0], language.lower()), 0.5))
    for w in words(title): t.append(('w|' + w, 0.5))
    if explicit: t.append(('e|explicit', 0.1))
    return t

def tokens(s):
    return tokens_from_fields(s['title'], app_artist_line(s), s['album'], s['label'], s['lang'], s['year'], s['composer'], s['explicit'])

def folds(pls, k=4, seed=11):
    r = np.random.default_rng(seed)
    order = r.permutation(len(pls))
    f = np.empty(len(pls), int)
    f[order] = np.arange(len(pls)) % k
    return f
