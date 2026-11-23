from exp_lib import *
c=make_ctx(0,('rand',0.25)); IA=p1_items(c,'all'); IC=p1_items(c,'cold'); QA=p2_items(c,'all',cap=100); QC=p2_items(c,'cold',cap=100)
W=json.load(open(OUT+'/best_w3_noidf.json'))
cfg=dict(bits=15,k=128,idf=False,seed=0x5EED,w=W); Xs=hashed_sparse(c,cfg,False)
def ev(name,kind,X,lam,tau=0):
    r=[p1_eval(X,IA)[0].mean(),p1_eval(X,IC)[0].mean()]; d={'x':(kind,X,lam,tau)}
    r+=[p2_eval(d,QA)['x'][0].mean(),p2_eval(d,QC)['x'][0].mean()]
    print(f'{name:34s}',np.round(r,4),round(sum(r),4),flush=True)
def blk(wA,wN,nohot=False,noise=0,cols_h=True):
    Z=(c.ATTz_nohot if nohot else c.ATTz).copy()
    if noise:
        rng=np.random.default_rng(1); Z[:,:11]=np.clip(Z[:,:11]+noise*rng.standard_normal((N,11)),-3,3)
    Z[:,:11]*=wA/5; Z[:,11:]*=wN/5; return sp.hstack([Xs,sp.csr_matrix(Z.astype(np.float32))]).tocsr()
for wN in (.5,1,1.5):
  for wA in (0,.15,.3,.5):
    for lam in (.3,1): ev(f'wN{wN} wA{wA} lam{lam}','diag',blk(wA,wN),lam)
print('--- nohot'); 
for wN in (1,): 
  for wA in (0,.3): ev(f'nohot wN{wN} wA{wA}','diag',blk(wA,wN,True),.3)
for tau in (.02,.05,.1): ev(f'sparse TS tau{tau}','diag',Xs,.3,tau)
