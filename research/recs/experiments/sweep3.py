from exp_lib import *
c=make_ctx(0,('rand',0.25)); IA=p1_items(c,'all'); IC=p1_items(c,'cold'); QA=p2_items(c,'all',cap=100); QC=p2_items(c,'cold',cap=100)
def mk(w,bits=15): return dict(bits=bits,k=128,idf=True,seed=0x5EED,w=w)
def score(cfg,idf=True,lam=.3):
    X=hashed_sparse(c,cfg,idf); r=[p1_eval(X,IA)[0].mean(),p1_eval(X,IC)[0].mean()]
    d={'x':('diag',X,lam)}
    r+= [p2_eval(d,QA)['x'][0].mean(), p2_eval(d,QC)['x'][0].mean()]
    return r
w2=json.load(open(OUT+'/best_w2.json'))
for lam in (.03,.1,.3):
    print('idf lam',lam,np.round(score(mk(w2),True,lam),4),flush=True)
# no-idf search
w=dict(a=.5,m=.25,lb=.25,lg=.5,y=.25,d=.5,al=.5,x=0,w=.25); best=sum(score(mk(w),False)); print('noidf start',best,flush=True)
for rnd in range(2):
  for t in ['a','m','al','lb','lg','y','d','x','w']:
    for v in (0,.25,.5,1,2):
        if v==w[t]: continue
        ww=dict(w); ww[t]=v; r=score(mk(ww),False); sc=sum(r)
        if sc>best+1e-3: best=sc; w=ww; print(rnd,t,v,np.round(r,3),round(sc,4),flush=True)
  print('-> best noidf',w,best,flush=True)
json.dump(w,open(OUT+'/best_w3_noidf.json','w'))
for lam in (.03,.1,.3,1):
    print('noidf lam',lam,np.round(score(mk(w),False,lam),4),flush=True)
