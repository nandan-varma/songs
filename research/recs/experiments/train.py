import sys,time,json,numpy as np,torch,torch.nn as nn,os
from sklearn.decomposition import PCA
torch.set_num_threads(3); torch.manual_seed(0)
from common import *; import net
size=sys.argv[1]; EPOCHS=int(sys.argv[2]); CROP=300; BS=64
ids,keep,Y,E=targets(); idx=np.where(keep)[0]; fo=folds(len(ids))
mel=torch.from_numpy(np.load(O+'/mel.npy',mmap_mode='r')[:])
gp=PCA(64,random_state=0).fit(E[idx]); gmu,gcomps=gp.mean_,gp.components_
os.makedirs(O+'/models',exist_ok=True)
P=np.full_like(Y,np.nan); EP=np.zeros_like(E); P300=np.full_like(Y,np.nan); EP300=np.zeros_like(E)
def predict(m,ii,mu,sd,crop=None,bs=128):
    m.eval(); out=[]
    with torch.no_grad():
        for a in range(0,len(ii),bs):
            x=mel[ii[a:a+bs]].float()
            if crop: s=(x.shape[2]-crop)//2; x=x[:,:,s:s+crop]
            out.append(m(((x-mu)/sd)[:,None]).numpy())
    return np.concatenate(out)
info={}
for k in range(3):
    t0=time.time(); tr_all=idx[fo[idx]!=k]; te=idx[fo[idx]==k]
    rs=np.random.default_rng(k).permutation(len(tr_all)); nv=int(0.08*len(tr_all)); va=tr_all[rs[:nv]]; tr=tr_all[rs[nv:]]
    sub=mel[tr[:1500]].float(); mu=sub.mean((0,2),keepdim=True)[:,:,None] if False else sub.mean((0,2)).view(1,64,1); sd=sub.std((0,2)).view(1,64,1)+1e-3
    ym=np.nanmean(Y[tr],0); ys=np.nanstd(Y[tr],0)
    pk=PCA(64,random_state=0).fit(E[tr_all]); zs=np.sqrt(pk.explained_variance_.sum()/64)
    def tgt(ii): return np.concatenate([(Y[ii]-ym)/ys,pk.transform(E[ii])/zs],1).astype(np.float32)
    Ttr,Tva=torch.from_numpy(tgt(tr)),torch.from_numpy(tgt(va))
    m=net.make(size); opt=torch.optim.AdamW(m.parameters(),lr=3e-3,weight_decay=1e-2)
    steps=EPOCHS*(len(tr)//BS); sch=torch.optim.lr_scheduler.OneCycleLR(opt,3e-3,total_steps=steps,pct_start=0.1)
    W=torch.cat([torch.ones(11),torch.full((64,),3.0/64)])
    def loss(o,t):
        mk=~torch.isnan(t); t0_=torch.where(mk,t,torch.zeros_like(t))
        return (((o-t0_)**2)*mk*W).sum()/(mk*W).sum()*1.0
    best=(1e9,None,0); bad=0
    for ep in range(EPOCHS):
        m.train(); perm=torch.from_numpy(np.random.default_rng(100*k+ep).permutation(len(tr))); tl=0;nb=0
        for a in range(0,len(perm)-BS+1,BS):
            b=perm[a:a+BS]; s=np.random.randint(0,mel.shape[2]-CROP+1)
            x=mel[torch.from_numpy(tr)[b]][:,:,s:s+CROP].float()+(torch.rand(len(b),1,1)*1.0-0.5)
            x=((x-mu)/sd)[:,None]; l=loss(m(x),Ttr[b]); opt.zero_grad(); l.backward(); opt.step(); sch.step(); tl+=l.item(); nb+=1
        pv=predict(m,va,mu,sd); vl=loss(torch.from_numpy(pv),Tva).item()
        print(f'{size} f{k} ep{ep} train {tl/nb:.4f} val {vl:.4f} t={time.time()-t0:.0f}s',flush=True)
        if vl<best[0]: best=(vl,{a:b.clone() for a,b in m.state_dict().items()},ep); bad=0
        else:
            bad+=1
            if bad>=7: break
    m.load_state_dict(best[1]); torch.save({'sd':best[1],'mu':mu,'sd_in':sd,'ym':ym,'ys':ys,'zs':zs,'pca_mean':pk.mean_,'pca_comps':pk.components_},O+f'/models/{size}_f{k}.pt')
    for tag,crop,PP,EE in (('full',None,P,EP),('c300',300,P300,EP300)):
        o=predict(m,te,mu,sd,crop); PP[te]=o[:,:11]*ys+ym; EE[te]=pk.inverse_transform(o[:,11:]*zs)
    info[f'f{k}']=dict(best_ep=best[2],train_s=time.time()-t0)
    print('fold',k,'done',info[f'f{k}'],flush=True)
    np.save(O+f'/partial_{size}.npy',{'P':P,'EP':EP,'P300':P300,'EP300':EP300,'folds_done':k+1},allow_pickle=True)
mt=metrics(Y[idx],P[idx]); ct=emb_metrics(E[idx],EP[idx],gmu,gcomps)
m3=metrics(Y[idx],P300[idx]); c3=emb_metrics(E[idx],EP300[idx],gmu,gcomps)
for nm,v in mt.items(): print(f'  {nm:10s} R2={v[0]:.3f} r={v[1]:.3f} rho={v[2]:.3f}')
print('emb cos=%.3f R2=%.3f'%ct)
np.save(O+f'/oof_{size}.npy',{'P':P,'EP':EP,'m':mt,'cr':ct,'m300':m3,'cr300':c3,'P300':P300,'info':info,'params':net.nparams(net.make(size))},allow_pickle=True)
