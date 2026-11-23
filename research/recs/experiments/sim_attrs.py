# Downstream check: replicate sim_final.py (leak-free playlist split, sequential ridge learner) with swapped attribute sources.
import sys,random,json,numpy as np,warnings; warnings.filterwarnings('ignore')
import os; _HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,os.path.join(_HERE,'..')); sys.path.insert(0,_HERE)
from build_feats import *      # cwd must be the scratch dir (RECS_WORK; data/ relative paths)
from sklearn.preprocessing import normalize
from common import *
from scipy.stats import spearmanr
BEST=sys.argv[1]
F,songs,ids,P=load(); ix={s:i for i,s in enumerate(ids)}; N=len(ids)
rng0=random.Random(3); PLall=[p for p in P if len(p)>=20]; rng0.shuffle(PLall); PLev=PLall[:150]; evset={tuple(p) for p in PLev}
Ptrain=[p for p in P if tuple(p) not in evset]
sids,keep,Y,E=targets(); sx={s:i for i,s in enumerate(sids)}
def load_src(path):
    d=np.load(path,allow_pickle=True).item(); return d
def attrs_from_arrays(P_,EP_,gmu,gcomps):
    """P_: (n,11) raw units (voice..electronic, arousal, valence, bpm); returns {sid:{attr:..}} in build_feats scale"""
    out={}
    for i,s in enumerate(sids):
        if not keep[i] or np.isnan(P_[i,0]): continue
        p=np.clip(P_[i,:8],0,1)
        out[s]=dict(voice=p[0],danceable=p[1],happy=p[2],sad=p[3],relaxed=p[4],party=p[5],acoustic=p[6],electronic=p[7],
                    arousal=(P_[i,8]-5)/4,valence=(P_[i,9]-5)/4,tempo=min(max(P_[i,10],0),220)/220,emb_pca=((EP_[i]-gmu)@gcomps.T).astype(np.float32))
    return out
from sklearn.decomposition import PCA
idx=np.where(keep)[0]; gp=PCA(64,random_state=0).fit(E[idx]); gmu,gcomps=gp.mean_,gp.components_
T=np.zeros_like(Y); T[:]=Y
teacher=attrs_from_arrays(Y,E,gmu,gcomps)
for s in teacher:                # teacher arousal/valence/bpm stay NaN-free only where present
    pass
stu=np.load(O+f'/oof_{BEST}.npy',allow_pickle=True).item(); student=attrs_from_arrays(stu['P'],stu['EP'],gmu,gcomps)
dsp=np.load(O+'/dsp_ridge_oof.npy',allow_pickle=True).item(); dsp_a=attrs_from_arrays(dsp['P'],dsp['EP'],gmu,gcomps)
np.save(O+'/student_attrs.npy',student,allow_pickle=True); np.save(O+'/dsp_attrs.npy',dsp_a,allow_pickle=True)
# noisy: independent gaussian noise at student RMSE (1x) and 2x, on each attr and emb_pca
rm=np.sqrt(np.nanmean((stu['P']-Y)**2,0)); rng=np.random.default_rng(7)
Zt=(stu['EP']-gmu)@gcomps.T-((E-gmu)@gcomps.T); erm=np.sqrt((Zt[idx]**2).mean(0))
def noisy(mult):
    Pn=np.where(np.isnan(Y),np.nan,Y+rng.normal(size=Y.shape)*rm*mult); En=E+((rng.normal(size=(len(E),64))*erm*mult)@gcomps)
    return attrs_from_arrays(Pn,En,gmu,gcomps)
noisy1=noisy(1.0); noisy2=noisy(2.0)
def variant(src,Fbase=F):
    """swap attributes in F-like dict; arousal/valence/bpm only where teacher has them (identical coverage)"""
    G={}
    for s in ids:
        f=dict(Fbase[s]); a=src[s]; v=a['voice']; 
        f['voice_instrumental']=[1-v,v]; f['danceability']=[a['danceable'],1-a['danceable']]; f['mood_happy']=[a['happy'],1-a['happy']]
        f['mood_sad']=[1-a['sad'],a['sad']]; f['mood_relaxed']=[1-a['relaxed'],a['relaxed']]; f['mood_party']=[1-a['party'],a['party']]
        f['mood_acoustic']=[a['acoustic'],1-a['acoustic']]; f['mood_electronic']=[a['electronic'],1-a['electronic']]
        if 'arousal' in Fbase[s]: f['arousal']=a['arousal']*4+5; f['valence']=a['valence']*4+5; f['bpm']=a['tempo']*220
        G[s]=f
    return G
def blockA(src):
    Z=np.vstack([src[s]['emb_pca'] for s in ids]); return normalize(Z-Z.mean(0))
cache={}
def getB(name,src):
    B=build(variant(src),songs,ids,Ptrain); B['A']=blockA(src); cache[name]=B; return B
Bs={'teacher':getB('teacher',teacher)}
for nm,src in (('student',student),('dsp',dsp_a),('noisy1x',noisy1),('noisy2x',noisy2)): Bs[nm]=getB(nm,src); print('built',nm,flush=True)
def design(B,wA=0.0,wT=0.0,Aover=None,Tover=None):
    parts=[B['Z'],B['E']]
    if wA: parts.append(wA*(Aover if Aover is not None else B['A']))
    X=np.hstack(parts); X=X/np.maximum(np.linalg.norm(X,axis=1,keepdims=True),1e-9)
    if wT: 
        T_=Tover if Tover is not None else B['ATTz']; X=np.hstack([X,wT*T_/np.sqrt(T_.shape[1])])
    return X
def run(Fm,pl,seed,rounds=10,slate=5,lam=3.0):
    rng=np.random.default_rng(seed); D=Fm.shape[1]; tgt={ix[s] for s in pl}; pi=list(tgt)
    s0=pi[int(rng.integers(len(pi)))]; seen={s0}; A=lam*np.eye(D); b=np.zeros(D); x=Fm[s0]; A+=np.outer(x,x); b+=x; hist=[]
    for r in range(rounds):
        w=np.linalg.solve(A,b); sc=Fm@w; sc[list(seen)]=-1e9
        top=np.argpartition(-sc,slate)[:slate]; hit=0
        for t in top:
            seen.add(t); x=Fm[t]
            if t in tgt: A+=np.outer(x,x); b+=x; hit+=1
            elif rng.random()<0.6: A+=np.outer(x,x)
        hist.append(hit/slate)
    return hist
REPS=3; rows={}; per={}
def ev(name,Fm):
    m=np.array([[np.mean(run(Fm,p,i+1000*r)) for i,p in enumerate(PLev)] for r in range(REPS)]).mean(0)   # per-playlist, avg over seeds
    m0=np.array([np.mean(run(Fm,p,i)) for i,p in enumerate(PLev)])                                          # harness-identical seeds
    per[name]=m; rows[name]=(m0.mean(),m0.std()/np.sqrt(len(m0)),m.mean(),m.std()/np.sqrt(len(m))); print(f'{name:44s} harness-seed {m0.mean():.4f}±{m0.std()/np.sqrt(len(m0)):.4f} | 3-seed avg {m.mean():.4f}±{m.std()/np.sqrt(len(m)):.4f}',flush=True)
ev('NO audio (content+CF+metadata only)',design(Bs['teacher']))
for wA,wT in ((0.5,0.5),(0.5,1.0),(0.5,0.0),(0.0,0.5)):
    for nm in ('teacher','student','dsp','noisy1x','noisy2x'):
        ev(f'{nm:8s} wA={wA} wT={wT}',design(Bs[nm],wA,wT))
# mixes: where does the loss come from (A vs attrs)
ev('student A + teacher attrs (0.5,0.5)',design(Bs['teacher'],0.5,0.5,Aover=Bs['student']['A']))
ev('teacher A + student attrs (0.5,0.5)',design(Bs['teacher'],0.5,0.5,Tover=Bs['student']['ATTz']))
base=per['NO audio (content+CF+metadata only)']; tch=per['teacher  wA=0.5 wT=0.5']
print('paired diffs vs teacher (wA=.5,wT=.5), 3-seed avg:')
paired={}
for nm in per:
    d=per[nm]-tch; paired[nm]=(d.mean(),d.std()/np.sqrt(len(d))); 
    print(f'  {nm:44s} {d.mean():+.4f}±{d.std()/np.sqrt(len(d)):.4f}')
json.dump({'rows':rows,'paired':paired},open(O+'/sim_results.json','w'),indent=1)
# ---- steering
def steer(src,name):
    out={}
    s_ids=[s for s in ids if s in src and s in teacher]
    tv=np.array([teacher[s]['voice'] for s in s_ids]); sv=np.array([src[s]['voice'] for s in s_ids])
    out['voice_spearman']=spearmanr(tv,sv)[0]
    tt=np.argsort(tv)[:100]; st=set(np.argsort(sv)[:300]); out['top100_instr_in_top300']=len(set(tt)&st)/100
    st50=np.argsort(sv)[:50]; out['top50_student_instr_teacher_voice<0.1']=float((tv[st50]<0.1).mean()); out['top50_student_instr_mean_teacher_voice']=float(tv[st50].mean())
    out['teacher_top50_mean_voice(oracle)']=float(np.sort(tv)[:50].mean()); out['random_mean_voice']=float(tv.mean())
    ha=[s for s in s_ids if 'arousal' in F[s]]; ta=np.array([teacher[s]['arousal'] for s in ha]); sa=np.array([src[s]['arousal'] for s in ha])
    out['arousal_spearman']=spearmanr(ta,sa)[0]; tt=np.argsort(-ta)[:100]; st=set(np.argsort(-sa)[:300]); out['top100_energy_in_top300']=len(set(tt)&st)/100
    st50=np.argsort(-sa)[:50]; out['top50_student_energy_mean_teacher_arousal_pctile']=float((ta[st50][:,None]>ta[None,:]).mean())
    return out
S_={nm:steer(src,nm) for nm,src in (('student',student),('dsp',dsp_a),('noisy1x',noisy1))}
json.dump(S_,open(O+'/steer.json','w'),indent=1); print(json.dumps(S_,indent=1))
