from exp_lib import *
c=make_ctx(0,('rand',0.25)); IA=p1_items(c,'all'); IC=p1_items(c,'cold'); QA=p2_items(c,'all',cap=100); QC=p2_items(c,'cold',cap=100)
W=json.load(open(OUT+'/best_w3_noidf.json'))
def cfgb(bits,k): return dict(bits=bits,k=k,idf=False,seed=0x5EED,w=W)
def ev(name,kind,X,lam):
    r=[p1_eval(X,IA)[0].mean(),p1_eval(X,IC)[0].mean()]; d={'x':(kind,X,lam)}
    r+=[p2_eval(d,QA)['x'][0].mean(),p2_eval(d,QC)['x'][0].mean()]
    print(f'{name:34s}',np.round(r,4),round(sum(r),4),flush=True)
for bits in (12,13,14,15):
    ev(f'sparse diag b{bits}','diag',hashed_sparse(c,cfgb(bits,64),False),.3)
    for k in (64,128,256):
        Xd=hashed_dense(c,cfgb(bits,k),False).astype(np.float32)
        ev(f'dense b{bits} k{k} lam3','dense',Xd,3.0)
for lam in (1,10): ev(f'dense b14 k128 lam{lam}','dense',hashed_dense(c,cfgb(14,128),False).astype(np.float32),lam)
ev('Z only (warm fit) lam3','dense',nrm(c.Zw).astype(np.float32),3.0)
for wT in (.3,.5,1.0):
  ev(f'F0 wT{wT}','dense',dense_design(c,1,1,.75,att=att_block(c,ALLC,wT)),3.0)
  ev(f'F2 Z+ATT wT{wT}','dense',dense_design(c,1,0,0,att=att_block(c,ALLC,wT)),3.0)
  H=hashed_dense(c,cfgb(14,128),False)
  ev(f'F4 hash+ATT wT{wT}','dense',dense_design(c,hashed=H,att=att_block(c,ALLC,wT)),3.0)
  ev(f'F5 hash+nonaudio wT{wT}','dense',dense_design(c,hashed=H,att=att_block(c,NONAUD,wT)),3.0)
