"""usage: run_exp.py FOLD SCEN(rand0.25|recent12|newartist0.25...) LEVEL(full|lite) CAP"""
import sys
from exp_lib import *
fold=int(sys.argv[1]); sc=sys.argv[2]; level=sys.argv[3]; cap=int(sys.argv[4])
scen=('rand',float(sc[4:])) if sc.startswith('rand') else ('recent',int(sc[6:])) if sc.startswith('recent') else ('newartist',float(sc[9:]))
c=make_ctx(fold,scen)
W=json.load(open(OUT+'/best_w3_noidf.json')); W2=json.load(open(OUT+'/best_w2.json'))
def cfgb(bits,w=W,k=128): return dict(bits=bits,k=k,idf=False,seed=0x5EED,w=w)
def att_s(wA,wN,nohot=True,noise=0.0,seed=1):
    Z=(c.ATTz_nohot if nohot else c.ATTz).copy()
    if noise:
        rng=np.random.default_rng(seed); Z[:,:11]=np.clip(Z[:,:11]+noise*rng.standard_normal((N,11)),-3,3)
    Z[:,:11]*=wA/5; Z[:,11:]*=wN/5; return sp.csr_matrix(Z.astype(np.float32))
def D(Xs,att=None): return sp.hstack([Xs,att]).tocsr() if att is not None else Xs.tocsr()
X15=hashed_sparse(c,cfgb(15),False)
d={}
def dn(name,X,lam=3.0): d[name]=('dense',X,lam)
def sd_(name,X,lam=.3,tau=0): d[name]=('diag',X.astype(np.float32),lam,tau)
dn('F0 full [Z,E,.75A,ATT]',dense_design(c,1,1,.75,att=att_block(c,ALLC,.5,nohot=True)))
dn('F0h full (hot leak)',dense_design(c,1,1,.75,att=att_block(c,ALLC,.5)))
dn('F0a [Z,E] no audio/att',dense_design(c,1,1,0))
dn('F1 Z only (fit on warm)',dense_design(c,1,0,0))
dn('F1c Z only (fit on ALL, optimistic)',nrm(c.Zcat).astype(np.float32))
dn('F2 Z+ATT (no E)',dense_design(c,1,0,0,att=att_block(c,ALLC,.5,nohot=True)))
dn('F2h Z+ATT (hot leak)',dense_design(c,1,0,0,att=att_block(c,ALLC,.5)))
sd_('F3s sparse diag b15',X15,.3)
sd_('F4 F3s+ATT teacher audio',D(X15,att_s(.3,1)),1.0)
sd_('F5 F3s+nonaudio(recent,lang)',D(X15,att_s(0,1)),1.0)
sd_('F6 F3s+ATT noisy audio 0.5sd',D(X15,att_s(.3,1,noise=.5)),1.0)
sd_('F4h F3s+ATT (hot leak)',D(X15,att_s(.3,1,nohot=False)),1.0)
sd_('F5h F3s+nonaudio (hot leak)',D(X15,att_s(0,1,nohot=False)),1.0)
if level=='full':
    sd_('F6b F3s+ATT noisy audio 1.0sd',D(X15,att_s(.3,1,noise=1.0)),1.0)
    sd_('F4a F3s+audio only',D(X15,att_s(.3,0)),1.0)
    for b in (12,13,14): sd_(f'F3s sparse diag b{b}',hashed_sparse(c,cfgb(b),False),.3)
    Xi=hashed_sparse(c,dict(bits=15,k=128,idf=True,seed=0x5EED,w=W2),True); sd_('F3s idf-weighted b15',Xi,.3)
    sd_('F4 idf-weighted +ATT',D(Xi,att_s(.3,1)),1.0)
    for k in (64,128,256,1024): dn(f'F3d dense b15 k{k}',hashed_dense(c,cfgb(15,k=k),False).astype(np.float32))
    dn('F3d dense b12 k128',hashed_dense(c,cfgb(12),False).astype(np.float32))
    dn('F4d dense k256 +ATT',dense_design(c,hashed=hashed_dense(c,cfgb(15,k=256),False),att=att_block(c,ALLC,1.0,nohot=True)))
    dn('F4d dense k1024 +ATT',dense_design(c,hashed=hashed_dense(c,cfgb(15,k=1024),False),att=att_block(c,ALLC,1.0,nohot=True)))
    sd_('F3s TS tau0.02',X15,.3,0.02)
    # token ablations of F3s
    for nm,drop in (('-album',['al']),('-title words',['w']),('-artistxlang',['x']),('-artist',['a']),('-composer',['m']),('-label',['lb']),('-year',['y','d']),('-lang',['lg'])):
        w=dict(W); [w.__setitem__(t,0) for t in drop]; sd_('F3s abl '+nm,hashed_sparse(c,cfgb(15,w),False),.3)
    w=dict(W); w.update(x=0,w=0); sd_('F3s abl base(a,m,lb,lg,y,d,al)',hashed_sparse(c,cfgb(15,w),False),.3)
    w.update(al=0); sd_('F3s abl base minus album',hashed_sparse(c,cfgb(15,w),False),.3)
    sd_('R0 plain TF-IDF (fit on warm)',c.Cw.astype(np.float32),.3)
if level=='extra':
    F0X=dense_design(c,1,1,.75,att=att_block(c,ALLC,.5,nohot=True)); F0s=sp.csr_matrix(F0X)
    d={'F0 dense ridge (ref)':d['F0 full [Z,E,.75A,ATT]'],'F4 F3s+ATT teacher audio':d['F4 F3s+ATT teacher audio']}
    for lam in (1.0,):
        sd_('F0 diag-learner',F0s,lam)
        for wh in (0.5,1.0):
            sd_(f'H hybrid F0+F3s(w{wh}) diag',sp.hstack([F0s,wh*X15]).tocsr(),lam)
            sd_(f'H hybrid F0+F3s(w{wh})+ATT-s diag',sp.hstack([F0s,wh*D(X15,att_s(.3,1))]).tocsr(),lam)
    dn('H hybrid dense F0 + hashed k1024 (w0.5)',np.hstack([F0X,0.5*hashed_dense(c,cfgb(15,k=1024),False).astype(np.float32)]))
res={}
for var in ('all','cold'):
    t=time.time(); I1=p1_items(c,var); I2=p2_items(c,var,cap=cap)
    p1={n:p1_eval(v[1],I1) for n,v in d.items()}; p2=p2_eval(d,I2)
    res[var]=dict(p1=p1,p2=p2,k1=[i['k'] for i in I1],l1=[i['lang'] for i in I1],k2=[i['k'] for i in I2],l2=[i['lang'] for i in I2])
    print(sc,fold,var,len(I1),len(I2),round(time.time()-t),flush=True)
pickle.dump(res,open(f'{OUT}/res_{sc}_{level}_f{fold}.pkl','wb'))
