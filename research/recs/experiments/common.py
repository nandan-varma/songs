import glob,numpy as np
from scipy.stats import pearsonr,spearmanr
S='/private/tmp/claude-501/-Users-nandan-dev-web-music-music-api/0c615e2d-e85f-41eb-99bc-164d1e551c62/scratchpad'
O=S+'/exp2'
TN=['voice','danceable','happy','sad','relaxed','party','acoustic','electronic','arousal','valence','bpm']
def load_teacher():
    F={}
    for pat in ('feat_*.npy','feat2_*.npy','feat3_*.npy'):
        for f in sorted(glob.glob(S+'/data/'+pat)): F.update(np.load(f,allow_pickle=True).item())
    return F
def targets():
    ids=[str(x) for x in np.load(O+'/ids.npy')]; F=load_teacher()
    keep=np.array([i in F for i in ids]); 
    Y=np.full((len(ids),11),np.nan,dtype=np.float64); E=np.zeros((len(ids),1280),np.float32)
    for k,s in enumerate(ids):
        if s not in F: continue
        f=F[s]; E[k]=f['emb']
        Y[k,:8]=[f['voice_instrumental'][1],f['danceability'][0],f['mood_happy'][0],f['mood_sad'][1],f['mood_relaxed'][1],f['mood_party'][1],f['mood_acoustic'][0],f['mood_electronic'][0]]
        if 'arousal' in f:
            Y[k,8]=f['arousal']; Y[k,9]=f['valence']; b=f['bpm']; Y[k,10]=b if b>0 else np.nan
    return ids,keep,Y,E
def folds(n,k=3,seed=0):
    r=np.random.default_rng(seed).permutation(n); f=np.empty(n,int); f[r]=np.arange(n)%k; return f
def metrics(Yt,Yp):
    out={}
    for j,nm in enumerate(TN):
        m=~np.isnan(Yt[:,j])&~np.isnan(Yp[:,j]); a,b=Yt[m,j],Yp[m,j]
        r2=1-((a-b)**2).sum()/((a-a.mean())**2).sum()
        out[nm]=(r2,pearsonr(a,b)[0],spearmanr(a,b)[0],int(m.sum()))
    return out
def emb_metrics(Et,Ep,pca_mu,comps):
    # compare in the global 64-d PCA basis
    T=(Et-pca_mu)@comps.T; P=(Ep-pca_mu)@comps.T
    cos=(T*P).sum(1)/(np.linalg.norm(T,axis=1)*np.linalg.norm(P,axis=1)+1e-9)
    r2=1-((T-P)**2).sum()/((T-T.mean(0))**2).sum()
    return float(cos.mean()),float(r2)
