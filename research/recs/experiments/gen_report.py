import sys,time,numpy as np
from aggregate import *
L=[]
def p(*a): L.append(' '.join(str(x) for x in a))
def f(t,n): return '%.3f ± %.3f'%(t[n][0],t[n][1])
def main_table(sc,level,names=None,title=''):
    T={k:table(sc,v,pr,m,level) for k,(v,pr,m) in dict(p1a=('all','p1',0),p1c=('cold','p1',0),r1a=('all','p1',1),r1c=('cold','p1',1),p2a=('all','p2',0),p2c=('cold','p2',0)).items()}
    names=names or list(T['p1a'])
    p(f'\n**{title}** ({sc}, n clusters P1/P2 all={T["p1a"][names[0]][3]}/{T["p2a"][names[0]][3]}, cold={T["p1c"][names[0]][3]}/{T["p2c"][names[0]][3]})\n')
    p('| config | P1 nDCG@20 all | P1 nDCG@20 cold | P1 R@100 all | P1 R@100 cold | P2 hit all | P2 hit cold |'); p('|---|---|---|---|---|---|---|')
    for n in names: p(f'| {n} | '+' | '.join(f(T[k],n) for k in ('p1a','p1c','r1a','r1c','p2a','p2c'))+' |')
    return T
def ret_table(T,names,ref,title):
    p(f'\n**{title}** (quality retained vs `{ref}`, ratio of means, bootstrap s.e.)\n')
    p('| config | P1 all | P1 cold | P2 all | P2 cold |'); p('|---|---|---|---|---|')
    for n in names:
        row=[]
        for k in ('p1a','p1c','p2a','p2c'):
            r,s=retention(T[k],n,ref); row.append('%.0f%% ± %.0f'%(100*r,100*s))
        p(f'| {n} | '+' | '.join(row)+' |')
p('## 1. Main grid: random 25% of songs cold (3 folds)')
T=main_table('rand0.25','full',title='All configurations')
main=['F0 full [Z,E,.75A,ATT]','F1 Z only (fit on warm)','F2 Z+ATT (no E)','F3s sparse diag b15','F4 F3s+ATT teacher audio','F5 F3s+nonaudio(recent,lang)','F6 F3s+ATT noisy audio 0.5sd','F4h F3s+ATT (hot leak)','F5h F3s+nonaudio (hot leak)','F0h full (hot leak)']
ret_table(T,main[1:],main[0],'Retention vs F0 (no-hot-leak F0)')
# extras
p('\n## 2. Hybrid / learner check (rand 25%)')
main_table('rand0.25','extra',title='Hybrid designs (not stateless: contain Z/E)')
# scenarios
p('\n## 3. Cold share / new-release scenarios (lite grid, 3 folds)')
sel=['F0 full [Z,E,.75A,ATT]','F1 Z only (fit on warm)','F2 Z+ATT (no E)','F3s sparse diag b15','F4 F3s+ATT teacher audio','F5 F3s+nonaudio(recent,lang)','F6 F3s+ATT noisy audio 0.5sd']
import numpy as np
sys.path.insert(0,'.')
for sc,desc in [('rand0.1','10% of songs cold'),('rand0.25','25% cold'),('rand0.5','50% cold'),('rand0.75','75% cold'),('recent12','songs released in the last 12 months are cold (1503 songs, 15%)'),('recent24','last 24 months cold (2257, 22%)'),('newartist0.25','25% of songs cold, ALL songs of the chosen artists (debut artists)')]:
    lv='full' if sc=='rand0.25' else 'lite'
    main_table(sc,lv,names=sel,title=desc)
# language
p('\n## 4. Per-language (playlists whose majority language is X; rand 25%)')
for lang in ('hindi','english','telugu','tamil','punjabi'):
    rows=[]
    for k,(v,pr,m) in dict(p1a=('all','p1',0),p1c=('cold','p1',0),p2a=('all','p2',0),p2c=('cold','p2',0)).items():
        try: rows.append(table('rand0.25',v,pr,m,'full',lang=lang))
        except Exception as e: rows.append(None)
    p(f'\n**{lang}** (clusters P1 all/cold, P2 all/cold = '+'/'.join(str(r[sel[0]][3]) if r else '0' for r in rows)+')\n')
    p('| config | P1 all | P1 cold | P2 all | P2 cold |'); p('|---|---|---|---|---|')
    for n in sel: p(f'| {n} | '+' | '.join((f(r,n) if r else '-') for r in rows)+' |')
open('/private/tmp/claude-501/-Users-nandan-dev-web-music-music-api/0c615e2d-e85f-41eb-99bc-164d1e551c62/scratchpad/exp1/tables.md','w').write('\n'.join(L))
