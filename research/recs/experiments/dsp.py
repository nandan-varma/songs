import numpy as np,time
from sklearn.linear_model import RidgeCV
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.ensemble import HistGradientBoostingRegressor as HGB
from common import *
ids,keep,Y,E=targets(); X=np.load(O+'/dsp.npy'); print('teacher coverage',keep.sum(),'/',len(ids),'av',(~np.isnan(Y[:,8])).sum())
X=np.nan_to_num(X); idx=np.where(keep)[0]; fo=folds(len(ids))
gp=PCA(64,random_state=0).fit(E[idx]); mu,comps=gp.mean_,gp.components_
res={}
for name in ('ridge','hgb'):
    P=np.full_like(Y,np.nan); EP=np.zeros_like(E); t=time.time()
    for k in range(3):
        tr=idx[fo[idx]!=k]; te=idx[fo[idx]==k]
        sc=StandardScaler().fit(X[tr]); Xtr,Xte=np.clip(sc.transform(X[tr]),-6,6),np.clip(sc.transform(X[te]),-6,6)
        for j in range(11):
            m=~np.isnan(Y[tr,j]); 
            mdl=RidgeCV(alphas=np.logspace(0,4,9)) if name=='ridge' else HGB(max_iter=200,learning_rate=0.08,max_leaf_nodes=15,l2_regularization=1.0)
            mdl.fit(Xtr[m],Y[tr][m,j]); P[te,j]=mdl.predict(Xte)
        pk=PCA(64,random_state=0).fit(E[tr]); Z=pk.transform(E[tr])
        if name=='ridge': mdl=RidgeCV(alphas=np.logspace(0,4,9)).fit(Xtr,Z); Zp=mdl.predict(Xte)
        else: Zp=np.stack([HGB(max_iter=100,learning_rate=0.1,max_leaf_nodes=15).fit(Xtr,Z[:,c]).predict(Xte) for c in range(64)],1)
        EP[te]=pk.inverse_transform(Zp)
    m=metrics(Y[idx],P[idx]); cr=emb_metrics(E[idx],EP[idx],mu,comps)
    print(name,'time',time.time()-t)
    for nm,v in m.items(): print(f'  {nm:10s} R2={v[0]:.3f} r={v[1]:.3f} rho={v[2]:.3f} n={v[3]}')
    print('  emb cos=%.3f R2=%.3f'%cr)
    np.save(O+f'/dsp_{name}_oof.npy',{'P':P,'EP':EP,'m':m,'cr':cr},allow_pickle=True)
