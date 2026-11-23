import pickle,glob,sys,collections,numpy as np
OUT='/private/tmp/claude-501/-Users-nandan-dev-web-music-music-api/0c615e2d-e85f-41eb-99bc-164d1e551c62/scratchpad/exp1'
def load(sc,level='full'):
    R=[pickle.load(open(f,'rb')) for f in sorted(glob.glob(f'{OUT}/res_{sc}_{level}_f*.pkl'))]
    return R
def cluster(vals,keys,folds):
    """average items within (fold,playlist) cluster -> array of cluster means"""
    g=collections.defaultdict(list)
    for v,k,f in zip(vals,keys,folds): g[(f,k)].append(v)
    return np.array([np.mean(x) for x in g.values()]),list(g.keys())
def table(sc,var,proto,metric,level='full',lang=None):
    """returns {cfg:(mean,se,clusterarray)} aligned cluster order across cfgs"""
    R=load(sc,level); out={}
    names=list(R[0][var][proto].keys())
    for n in names:
        vals,keys,folds,langs=[],[],[],[]
        for fi,r in enumerate(R):
            x=r[var][proto][n][metric]; vals+=list(x)
            keys+=r[var]['k1' if proto=='p1' else 'k2']; langs+=r[var]['l1' if proto=='p1' else 'l2']; folds+=[fi]*len(x)
        if lang: sel=[i for i,l in enumerate(langs) if l==lang]; vals=[vals[i] for i in sel]; keys=[keys[i] for i in sel]; folds=[folds[i] for i in sel]
        cm,ck=cluster(vals,keys,folds); out[n]=(cm.mean(),cm.std(ddof=1)/np.sqrt(len(cm)) if len(cm)>1 else np.nan,cm,len(cm))
    return out
def retention(t,n,ref,B=300,seed=0):
    a,b=t[n][2],t[ref][2]; rng=np.random.default_rng(seed); k=len(a); r=[]
    for _ in range(B):
        i=rng.integers(0,k,k); r.append(a[i].mean()/max(b[i].mean(),1e-9))
    return t[n][0]/t[ref][0],np.std(r)
