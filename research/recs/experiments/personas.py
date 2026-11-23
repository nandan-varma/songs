import re, numpy as np

THEMES = {
    'retro': r'\b(19[5-9]0s|[5-9]0s|70s|80s|90s|retro|classic|golden|evergreen|old|vintage|yesteryear|nostalgi)',
    'romance': r'(love|romanc|romantic|melod|couple|valentine|wedding|duet)',
    'sad': r'(sad|heartbreak|broken|senti|dard|pain|judaai|breakup|tears|rain)',
    'party': r'(dance|party|bangers|workout|club|dj\b|remix|gym|road ?trip|dhol|mass|item)',
    'hiphop': r'(hip ?hop|rap|indie|trap|drill)',
    'devotional': r'(devotion|bhakt|bhajan|bhakthi|god|jai |devi|krishna|ram\b|shiv|ganesh|hanuman|ayyappa|venkatesh|sai|aarti|mantra|lord|kirtan|abhang|janmashtami|navratri)',
    'folk': r'(folk|lavani|garba|dandiya|lok|sufi|qawwali|ghazal|village|desi)',
    'new': r'(202\d|latest|trending|viral|new\b|fresh|2k|top 50|top hits|chartbuster|hot)',
    'millennial': r'(2000s|2010s|201\d|200\d|noughties|millennial|decade)',
    'chill': r'(chill|lofi|lo-fi|acoustic|instrumental|piano|unplugged|calm|focus|sleep|yoga|study|relax|soothing)',
}

def theme_playlists(w, lang, theme):
    rx = re.compile(THEMES[theme])
    return [pi for pi, p in enumerate(w.pls) if w.plang[pi] == lang and rx.search(p['title'].lower())]

def build(w, lang, theme, min_songs=80, min_pls=3):
    pls = theme_playlists(w, lang, theme)
    songs = sorted({i for pi in pls for i in w.P[pi] if w.lang[i] == lang})
    if len(songs) < min_songs or len(pls) < min_pls: return None
    return dict(lang=lang, theme=theme, pls=pls, songs=np.array(songs))

COMPOSITE = {'lovelorn': ('romance', 'sad'), 'throwback': ('retro', 'millennial')}

def pls_for(w, lang, theme):
    parts = COMPOSITE.get(theme, (theme,))
    return sorted({pi for t in parts for pi in theme_playlists(w, lang, t)})

def persona(w, lang, theme):
    pls = pls_for(w, lang, theme)
    songs = np.array(sorted({i for pi in pls for i in w.P[pi] if w.lang[i] == lang}))
    return dict(lang=lang, theme=theme, pls=pls, songs=songs)

def choose(w, lang, k=5, min_songs=70, min_pls=3, max_overlap=0.45):
    cands = [persona(w, lang, t) for t in list(THEMES) + list(COMPOSITE)]
    cands = [c for c in cands if len(c['songs']) >= min_songs and len(c['pls']) >= min_pls]
    cands.sort(key=lambda c: -len(c['songs']))
    out = []
    for c in cands:
        s = set(c['songs'])
        if all(len(s & set(o['songs'])) / len(s | set(o['songs'])) < max_overlap for o in out):
            out.append(c)
        if len(out) == k: break
    return out
