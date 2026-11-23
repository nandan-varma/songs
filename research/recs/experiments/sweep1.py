from exp_lib import *
import copy, itertools
c=make_ctx(0,('rand',0.25)); IA=p1_items(c,'all'); IC=p1_items(c,'cold')
def score(cfg,idf=True):
    X=hashed_sparse(c,cfg,idf); a=p1_eval(X,IA)[0].mean(); b=p1_eval(X,IC)[0].mean(); return a,b
def mk(w,bits=15): return dict(bits=bits,k=128,idf=True,seed=0x5EED,w=w)
base=dict(a=1,m=1,lb=.5,lg=.5,y=.5,d=.5,al=1,x=0,w=0)
print('tfidf-warm Z-free ref: sparse TFIDF Cw', p1_eval(c.Cw,IA)[0].mean(),p1_eval(c.Cw,IC)[0].mean())
for idf in (True,False): print('base idf',idf,score(mk(base),idf))
w=dict(base); best=sum(score(mk(w)))
for rnd in range(2):
  for t in ['a','m','al','lb','lg','y','d','x','w']:
    for v in (0,.25,.5,1,2):
        if v==w[t]: continue
        w2=dict(w); w2[t]=v; sc=sum(score(mk(w2)))
        print(rnd,t,v,round(sc,4),flush=True)
        if sc>best+1e-4: best=sc; w=w2
    print('-> best',w,best,flush=True)
print('final',w,score(mk(w)))
json.dump(w,open(OUT+'/best_w.json','w'))
