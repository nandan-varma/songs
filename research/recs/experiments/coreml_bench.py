import torch,torch.nn as nn,numpy as np,time,coremltools as ct
def blk(i,o): return nn.Sequential(nn.Conv2d(i,o,3,padding=1,bias=False),nn.BatchNorm2d(o),nn.ReLU(),nn.MaxPool2d(2))
m=nn.Sequential(blk(1,32),blk(32,64),blk(64,96),blk(96,160),nn.AdaptiveAvgPool2d(1),nn.Flatten(),nn.Linear(160,64))
m.eval(); print("params",sum(p.numel() for p in m.parameters()))
x=torch.randn(1,1,64,470)
tr=torch.jit.trace(m,x)
for prec,name in [(ct.precision.FLOAT16,'fp16')]:
    ml=ct.convert(tr,inputs=[ct.TensorType(name='mel',shape=(1,1,64,470))],convert_to='mlprogram',minimum_deployment_target=ct.target.iOS17,compute_precision=prec)
    ml.save(f'/tmp/_m_{name}.mlpackage') if False else None
    for cu in [ct.ComputeUnit.CPU_ONLY,ct.ComputeUnit.CPU_AND_GPU,ct.ComputeUnit.CPU_AND_NE]:
        t0=time.time(); mm=ct.models.MLModel(ml.get_spec() and ml.package_path if False else ml.package_path,compute_units=cu); load=time.time()-t0
        inp={'mel':np.random.randn(1,1,64,470).astype(np.float32)}
        mm.predict(inp)
        ts=[]
        for _ in range(100):
            t=time.perf_counter(); mm.predict(inp); ts.append((time.perf_counter()-t)*1000)
        ts=np.array(ts);print(name,cu,"load_s %.2f"%load,"median ms %.2f p90 %.2f"%(np.median(ts),np.percentile(ts,90)))
