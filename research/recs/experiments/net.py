import torch,torch.nn as nn
NOUT=11+64
class Blk(nn.Module):
    def __init__(s,ci,co,sep,pool=True):
        super().__init__()
        L=[nn.Conv2d(ci,ci,3,padding=1,groups=ci,bias=False),nn.Conv2d(ci,co,1,bias=False)] if sep else [nn.Conv2d(ci,co,3,padding=1,bias=False)]
        L+=[nn.BatchNorm2d(co),nn.ReLU(inplace=True)]
        if pool: L.append(nn.MaxPool2d(2))
        s.f=nn.Sequential(*L)
    def forward(s,x): return s.f(x)
class Student(nn.Module):
    def __init__(s,w,sep=False,stem_stride=1):
        super().__init__()
        L=[nn.Conv2d(1,w[0],3,stride=stem_stride,padding=1,bias=False),nn.BatchNorm2d(w[0]),nn.ReLU(inplace=True),nn.MaxPool2d(2)]
        ci=w[0]
        for i,c in enumerate(w[1:]): L.append(Blk(ci,c,sep,pool=(i<len(w)-2) )); ci=c
        s.body=nn.Sequential(*L); s.head=nn.Sequential(nn.Dropout(0.2),nn.Linear(2*ci,NOUT))
    def forward(s,x):                       # x: (B,1,64,T) normalised log-mel
        h=s.body(x).mean(2)                 # mean over freq -> (B,C,T')
        h=torch.cat([h.mean(2),h.amax(2)],1)
        return s.head(h)
CFG={'small':dict(w=[16,32,48,80,112]),'large':dict(w=[32,64,96,160,256])}
def make(n): return Student(**CFG[n])
def nparams(m): return sum(p.numel() for p in m.parameters())
