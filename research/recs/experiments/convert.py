import sys,time,numpy as np,torch,coremltools as ct,os,json
torch.set_num_threads(3)
from common import *; import net
size=sys.argv[1]; ck=torch.load(O+f'/models/{size}_f0.pt',weights_only=False)
class W(torch.nn.Module):
    def __init__(s,m):
        super().__init__(); s.m=m; s.register_buffer('mu',ck['mu']); s.register_buffer('sd',ck['sd_in'])
        s.register_buffer('ym',torch.tensor(np.r_[ck['ym'],np.zeros(64)],dtype=torch.float32)); s.register_buffer('ys',torch.tensor(np.r_[ck['ys'],np.full(64,ck['zs'])],dtype=torch.float32))
    def forward(s,x): return s.m(((x[:,0]-s.mu)/s.sd)[:,None])*s.ys+s.ym     # (1,75): 11 attrs (teacher units) + 64 PCA coords (fold-0 basis)
m=net.make(size); m.load_state_dict(ck['sd']); w=W(m).eval()
mel=np.load(O+'/mel.npy',mmap_mode='r'); x=torch.from_numpy(np.array(mel[:50]).astype(np.float32))[:,None]
tr=torch.jit.trace(w,x[:1])
ml=ct.convert(tr,inputs=[ct.TensorType(name='logmel',shape=(1,1,64,469))],outputs=[ct.TensorType(name='out')],convert_to='mlprogram',compute_precision=ct.precision.FLOAT16,compute_units=ct.ComputeUnit.CPU_ONLY,minimum_deployment_target=ct.target.iOS16)
ml.save(O+'/student.mlpackage')
np.savez(O+'/student_pca_basis_fold0.npz',mean=ck['pca_mean'],comps=ck['pca_comps'])
sz=sum(os.path.getsize(os.path.join(d,f)) for d,_,fs in os.walk(O+'/student.mlpackage') for f in fs)
mm=0;rel=[]
with torch.no_grad():
    for i in range(50):
        ref=w(x[i:i+1]).numpy(); o=ml.predict({'logmel':x[i:i+1].numpy()})['out']; mm=max(mm,np.abs(ref-o).max()); rel.append(np.abs(ref[0,:11]-o[0,:11]).max())
    t=[];
    for i in range(50): a=time.time(); ml.predict({'logmel':x[i:i+1].numpy()}); t.append(time.time()-a)
    tp=[]
    for i in range(50): a=time.time(); w(x[i:i+1]); tp.append(time.time()-a)
fp16=sum(p.numel() for p in m.parameters())*2/1024
print(json.dumps(dict(params=net.nparams(m),fp16_kb=fp16,mlpackage_kb=sz/1024,max_abs_diff_all=float(mm),max_abs_diff_attrs=float(max(rel)),coreml_cpu_ms_median=float(np.median(t)*1000),torch_cpu_ms_median=float(np.median(tp)*1000))))
