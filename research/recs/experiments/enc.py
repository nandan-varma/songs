import numpy as np, torch, torch.nn as nn, torch.nn.functional as F, collections

class Vocab:
    def __init__(self, world, train_songs, min_count=2):
        c = collections.Counter(t for i in train_songs for t in set(world.tok[i]))
        self.t2i = {t: k + 1 for k, t in enumerate(sorted(t for t, n in c.items() if n >= min_count))}
        self.size = len(self.t2i) + 1
        L = max(len(x) for x in world.tok)
        self.idx = np.zeros((world.N, L), np.int64); self.w = np.zeros((world.N, L), np.float32)
        for i in range(world.N):
            for j, (t, wt) in enumerate(zip(world.tok[i], world.tokw[i])):
                self.idx[i, j] = self.t2i.get(t, 0); self.w[i, j] = wt if t in self.t2i else 0.0

class Enc(nn.Module):
    def __init__(self, vocab_size, dim=64, hidden=0, drop=0.0):
        super().__init__()
        self.emb = nn.Embedding(vocab_size, dim, padding_idx=0)
        nn.init.normal_(self.emb.weight, std=0.1)
        self.mlp = nn.Sequential(nn.Linear(dim, hidden), nn.GELU(), nn.Linear(hidden, dim)) if hidden else None
        self.drop = drop
    def forward(self, idx, w):
        if self.training and self.drop > 0:
            keep = (torch.rand_like(w) > self.drop).float()
            keep[:, 0] = torch.maximum(keep[:, 0], (keep.sum(1) == 0).float())
            w = w * keep
        z = (self.emb(idx) * w.unsqueeze(-1)).sum(1) / (w.sum(1, keepdim=True) + 1e-6)
        if self.mlp is not None: z = z + self.mlp(z)
        return F.normalize(z, dim=-1)

def train(world, vocab, train_pls, dim=64, hidden=0, drop=0.25, steps=2000, batch=1024, lr=5e-3, tau=0.07, diff_artist=False, wd=0.0, seed=0, device='cpu'):
    torch.manual_seed(seed); rng = np.random.default_rng(seed)
    pls = [np.array(p) for p in train_pls if len(p) >= 2]
    sizes = np.array([len(p) for p in pls], float)
    m = Enc(vocab.size, dim, hidden, drop).to(device)
    opt = torch.optim.Adam(m.parameters(), lr=lr, weight_decay=wd)
    idx_t = torch.from_numpy(vocab.idx).to(device); w_t = torch.from_numpy(vocab.w).to(device)
    prim = np.array([hash(p) for p in world.prim])
    for step in range(steps):
        pi = rng.integers(len(pls), size=batch)
        a = np.empty(batch, int); b = np.empty(batch, int)
        for k, q in enumerate(pi):
            p = pls[q]
            x = p[rng.integers(len(p))]
            if diff_artist:
                cand = p[prim[p] != prim[x]]
                y = cand[rng.integers(len(cand))] if len(cand) else p[rng.integers(len(p))]
            else:
                y = p[rng.integers(len(p))]
            a[k] = x; b[k] = y
        ea = m(idx_t[a], w_t[a]); eb = m(idx_t[b], w_t[b])
        logits = ea @ eb.T / tau
        same = torch.from_numpy(a[:, None] == b[None, :]).to(device)
        diag = torch.arange(batch, device=device)
        mask = same.clone(); mask[diag, diag] = False
        logits = logits.masked_fill(mask, -1e9)
        loss = (F.cross_entropy(logits, diag) + F.cross_entropy(logits.T, diag)) / 2
        opt.zero_grad(); loss.backward(); opt.step()
    m.eval()
    with torch.no_grad():
        E = torch.cat([m(idx_t[i:i + 4096], w_t[i:i + 4096]) for i in range(0, world.N, 4096)]).cpu().numpy()
    return m, E
