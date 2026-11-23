# Step 1+3a: decode clips (essentia MonoLoader 16k, same as teacher), log-mel memmap + handcrafted DSP features.
import os,sys,glob,numpy as np,warnings; warnings.filterwarnings('ignore')
os.environ['OMP_NUM_THREADS']='1'
import essentia; essentia.log.infoActive=False; essentia.log.warningActive=False
import essentia.standard as es, librosa
from multiprocessing import Pool
S='/private/tmp/claude-501/-Users-nandan-dev-web-music-music-api/0c615e2d-e85f-41eb-99bc-164d1e551c62/scratchpad'
OUT=S+'/exp2'; T=469; NM=64; SR=16000
MEL=librosa.filters.mel(sr=SR,n_fft=1024,n_mels=NM,fmin=30,fmax=8000).astype(np.float32)
def work(f):
    a=es.MonoLoader(filename=f,sampleRate=SR,resampleQuality=4)()
    n=15*SR; a=a[:n] if len(a)>=n else np.pad(a,(0,n-len(a)))
    Sg=np.abs(librosa.stft(a,n_fft=1024,hop_length=512,center=True))**2   # (513,T)
    Sg=Sg[:,:T]
    mel=MEL@Sg; lm=np.log(mel+1e-6).astype(np.float32)
    # ---- handcrafted DSP
    fr=np.fft.rfftfreq(1024,1/SR)
    rms=librosa.feature.rms(S=np.sqrt(Sg),frame_length=1024)[0]; db=20*np.log10(rms+1e-6)
    P=Sg+1e-10; Pn=P/P.sum(0,keepdims=True)
    cen=(fr[:,None]*Pn).sum(0); cs=np.cumsum(Pn,0); roll=fr[(cs>=0.85).argmax(0)]
    mag=np.sqrt(Sg); flux=np.sqrt((np.diff(mag,axis=1).clip(0)**2).sum(0))
    zcr=librosa.feature.zero_crossing_rate(a,frame_length=1024,hop_length=512)[0]
    bands=[(0,150),(150,500),(500,2000),(2000,4000),(4000,8000)]
    be=np.array([Sg[(fr>=lo)&(fr<hi)].sum(0) for lo,hi in bands])+1e-10; ber=np.log(be/be.sum(0,keepdims=True)).mean(1)
    oenv=librosa.onset.onset_strength(S=lm.T.T,sr=SR,hop_length=512)
    on=librosa.onset.onset_detect(onset_envelope=oenv,sr=SR,hop_length=512)
    onrate=len(on)/15.0
    ac=librosa.autocorrelate(oenv-oenv.mean(),max_size=200); ac=ac/(ac[0]+1e-9)
    lags=np.arange(len(ac)); fps=SR/512
    bpm_lag=60*fps/np.maximum(lags,1); m=(bpm_lag>=60)&(bpm_lag<=200)
    acs=ac[m]; best=lags[m][acs.argmax()]; bpm=60*fps/best
    ac_bins=np.interp(np.linspace(60,200,16),bpm_lag[m][::-1],ac[m][::-1])
    mf=librosa.feature.mfcc(S=lm.T.T*10/np.log(10),n_mfcc=20); mfd=librosa.feature.delta(mf)
    # chroma-ish tonality from stft
    ch=librosa.feature.chroma_stft(S=Sg,sr=SR); chm=ch.mean(1); tonal=chm.max()/(chm.mean()+1e-9)
    flat=librosa.feature.spectral_flatness(S=np.sqrt(Sg))[0]
    ctr=librosa.feature.spectral_contrast(S=np.sqrt(Sg),sr=SR,n_bands=4,fmin=100)
    q=lambda x:[x.mean(),x.std()]
    d=[*q(db),np.percentile(db,95)-np.percentile(db,5),*q(cen),*q(roll),*q(flux),*q(zcr),*q(flat),
       onrate,bpm,bpm/2,bpm*2,acs.max(),tonal,*ber,*ac_bins,*mf.mean(1),*mf.std(1),*mfd.std(1),*ctr.mean(1),
       *q(oenv),*chm,*lm.mean(1)[::4],*lm.std(1)[::4]]
    return lm.astype(np.float16),np.array(d,dtype=np.float32)
if __name__=='__main__':
    files=sorted(glob.glob(S+'/data/clips/*.mp3')); ids=[os.path.basename(f)[:-4] for f in files]
    mm=np.lib.format.open_memmap(OUT+'/mel.npy',mode='w+',dtype=np.float16,shape=(len(ids),NM,T))
    D=[]
    with Pool(3) as p:
        for i,(m,d) in enumerate(p.imap(work,files,chunksize=8)):
            mm[i]=m; D.append(d)
            if i%1000==0: print(i,flush=True)
    mm.flush(); np.save(OUT+'/dsp.npy',np.stack(D)); np.save(OUT+'/ids.npy',np.array(ids))
    print('done',len(ids),np.stack(D).shape)
