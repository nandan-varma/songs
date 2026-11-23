from exp_lib import *
c=make_ctx(0,('rand',0.25)); IA=p1_items(c,'all'); IC=p1_items(c,'cold'); QA=p2_items(c,'all',cap=100); QC=p2_items(c,'cold',cap=100)
W=json.load(open(OUT+'/best_w3_noidf.json'))
def cfgb(bits,k=128): return dict(bits=bits,k=k,idf=False,seed=0x5EED,w=W)
def ev(name,kind,X,lam,tau=0):
    r=[p1_eval(X,IA)[0].mean(),p1_eval(X,IC)[0].mean()]; d={'x':(kind,X,lam,tau)}
    r+=[p2_eval(d,QA)['x'][0].mean(),p2_eval(d,QC)['x'][0].mean()]
    print(f'{name:34s}',np.round(r,4),round(sum(r),4),flush=True)
for bits in (16,18): ev(f'sparse diag b{bits}','diag',hashed_sparse(c,cfgb(bits),False),.3)
for k in (512,1024): ev(f'dense b15 k{k} lam3','dense',hashed_dense(c,cfgb(15,k),False).astype(np.float32),3.0)
Xs=hashed_sparse(c,cfgb(15),False)
def withatt(Xs,att): return sp.hstack([Xs,sp.csr_matrix(att.astype(np.float32))]).tocsr()
for wT in (.5,1,2,4):
  for lam in (.3,1):
    ev(f'sparse+ATT wT{wT} lam{lam}','diag',withatt(Xs,att_block(c,ALLC,wT)),lam)
for wT in (1,2):
    ev(f'sparse+nonaudio wT{wT}','diag',withatt(Xs,att_block(c,NONAUD,wT)),.3)
    ev(f'sparse+audio-only wT{wT}','diag',withatt(Xs,att_block(c,AUDIO,wT)),.3)
for tau in (.3,1): ev(f'sparse TS tau{tau}','diag',Xs,.3,tau)
