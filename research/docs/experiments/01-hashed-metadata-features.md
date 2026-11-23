# Stateless song features vs the full model — offline experiment

All numbers: mean ± s.e. (s.e. is over playlist clusters, i.e. the 2 P1 draws of one playlist are averaged first; 3 folds pooled). Code: `tools/recs/experiments/{exp_lib,run_exp,aggregate,gen_report}.py`; feature builder: `tools/recs/experiments/hashed_features.py`. Raw per-item results: `exp1/res_*.pkl`. Headless, `nice -n 15`, 1 thread x 3 processes.

## 0. Protocol (what was actually run)

* Catalog: 10,029 songs with teacher audio, 1,070 playlists (>=8 songs). Playlists split into 4 folds: fold 0 = DEV (all tuning: token weights, bits, lambdas, block weights), folds 1-3 = three evaluation reps. For rep r, every model-fitting step (PPMI+SVD CF `E`, TF-IDF+SVD `Z`, PCA `A`) uses only playlists of the other folds, i.e. **no evaluation playlist is seen by anything fitted**.
* Cold songs = a mask over songs (main: random 25%). Masked songs are removed from every training playlist (so `E`=0 for them), the TF-IDF/SVD vocabulary `Z` is **fitted on the non-cold songs only** and cold songs are projected (so unseen artists/tokens are dropped, as for a real new song), and the hashed-feature idf (when used) is counted on non-cold songs only. `F1c` shows `Z` fitted on all songs (what the old scripts did): no difference, so Z-leak was not a problem.
* **P1 playlist continuation**: 5 seed songs from a held-out playlist (>=12 songs), same-artist (incl. featured) and same-album candidates of any seed excluded, score = dot product with the seed centroid, nDCG@20 / R@100, 2 draws per playlist. `all` = targets are all remaining members. `cold` = seeds are 5 *warm* members, targets are only the *cold* members (>=3), other warm members are ignored (neither candidates nor targets), pool = the whole 10k catalog (warm + cold compete).
* **P2 sequential learner sim** (same as sim_final.py): 1 seed like, 10 rounds x 5-song slates, likes = playlist members, 60% of non-members are explicit negatives (y=0 update), ridge lam=3 (dense) . Metric = mean slate hit rate over 10 rounds. <=150 held-out playlists (>=20 songs) per rep. `cold`: seed is a warm member, hits count only cold members, warm members are removed from the pool; the learner must surface cold songs it has never seen interactions for. (Chance level is ~0.0005.)
* Designs: dense = hstack[(wZ Z, wE E, wA A) -> L2-normalised, then wT*ATTz/5 appended] (sim_final.py convention; F0 uses wZ=wE=1, wA=0.75, wT=0.5 tuned on dev). ATTz = the 25 steerable attributes z-scored (11 audio: voice, danceable, happy, sad, relaxed, party, acoustic, electronic, arousal, valence, tempo; 14 non-audio: hot, recent, 12 language one-hots).
* **Important correction**: the `hot` attribute is built from the `fresh:*` playlists, which are also evaluation playlists, so it leaks the target. All main rows therefore **zero `hot`** (column 11). Rows marked `(hot leak)` / suffix `h` keep it, to show how misleading it is (F4h P1-all 0.290 vs 0.219).
* Learners: dense Bayesian ridge (as the app) for dense designs; for sparse designs the **diagonal-precision Bayesian linear learner** (`DiagBayes` in hashed_features.py): prior precision lam0 per feature, likes add x_j^2 to precision and x_j to the information vector, explicit negatives add precision only; mean w=b/A; sparse O(nnz) updates; Thompson draw w+tau*N(0,1)/sqrt(A) supported. lam0=0.3 (hashed only) / 1.0 (with ATT columns), tuned on dev.
* P1 for sparse designs = cosine to seed centroid in hashed space.

## 0b. Best stateless design (port spec) — "F4 = hashed-sparse + ATT"

Per song, from API fields only (strings lowercased where stated; every token string is `type|value`; duplicates within a song removed):

| type | value | weight |
|---|---|---|
| a | each artist id, primary and featured | 0.50 |
| m | each composer name, `music` string split on ',' , trimmed, lowercased | 0.25 |
| al | album id | 1.00 |
| lb | label, trimmed, lowercased | 0.50 |
| lg | language | 0.50 |
| y | release year (`year`) | 0.25 |
| d | year // 5 | 0.50 |
| x | `primaryArtistId|language` cross token | 0.50 |
| w | each title word (regex `\w+` unicode, lowercased, length >= 2) | 0.50 |

* Hash: FNV-1a 64-bit over UTF-8 bytes of the token string (offset 0xcbf29ce484222325, prime 0x100000001b3, wrapping UInt64). bucket = h & (2^15 - 1); sign = +1 if bit 32 of h set else -1. Value = weight x sign, summed into a sparse vector of 2^15 buckets (collisions add), then L2-normalised. **No idf** (idf-weighting was worse: see section 1 `idf-weighted`). ~12.5 non-zeros per song.
* Appended dense coordinates (columns after the 2^15 buckets), each = clip(z,-3,3) * w / 5 with z using fixed constants (mean/sd of the 10k catalogue, 25 numbers shipped, no index): audio block (11 cols) w=0.3; steer block (recent, 12 language one-hots; `hot` only if a legitimate runtime source exists) w=1.0. On-device audio models with noise up to 0.5 sd cost almost nothing (F6).
* Learner: DiagBayes, lam0=1.0, state = two float arrays of 32768+25 (~256 KB per mode), score = sparse matvec. A sample of 5,000 candidates scores in ~0.14 ms (numpy CSR, 1 thread). Full reference implementation in `hashed_features.py` (tokens, FNV hash, sparse builder, DiagBayes; the optional random projection uses splitmix64 and is *not* recommended).
* Tuning evidence: weights found by coordinate search on dev fold with objective P1(all)+P1(cold)+P2(all)+P2(cold) using the diag learner at 2^15 buckets. NB: tuning on P1 alone drove the artist weight to 0 because P1 excludes same-artist candidates; the composite objective keeps artist at 0.5 (removing artists costs P2: 0.212 vs 0.227 all, 0.054 vs 0.063 cold).

## 1. Results
## 1. Main grid: random 25% of songs cold (3 folds)

**All configurations** (rand0.25, n clusters P1/P2 all=516/437, cold=345/426)

| config | P1 nDCG@20 all | P1 nDCG@20 cold | P1 R@100 all | P1 R@100 cold | P2 hit all | P2 hit cold |
|---|---|---|---|---|---|---|
| F0 full [Z,E,.75A,ATT] | 0.335 ± 0.011 | 0.091 ± 0.010 | 0.693 ± 0.011 | 0.389 ± 0.019 | 0.304 ± 0.011 | 0.061 ± 0.004 |
| F0h full (hot leak) | 0.356 ± 0.011 | 0.093 ± 0.010 | 0.713 ± 0.010 | 0.409 ± 0.019 | 0.327 ± 0.011 | 0.065 ± 0.004 |
| F0a [Z,E] no audio/att | 0.314 ± 0.011 | 0.067 ± 0.009 | 0.647 ± 0.012 | 0.299 ± 0.018 | 0.277 ± 0.011 | 0.053 ± 0.004 |
| F1 Z only (fit on warm) | 0.166 ± 0.009 | 0.131 ± 0.010 | 0.453 ± 0.013 | 0.441 ± 0.016 | 0.184 ± 0.009 | 0.053 ± 0.003 |
| F1c Z only (fit on ALL, optimistic) | 0.167 ± 0.009 | 0.125 ± 0.010 | 0.449 ± 0.013 | 0.424 ± 0.016 | 0.185 ± 0.009 | 0.052 ± 0.003 |
| F2 Z+ATT (no E) | 0.195 ± 0.009 | 0.153 ± 0.011 | 0.519 ± 0.013 | 0.501 ± 0.016 | 0.206 ± 0.009 | 0.056 ± 0.003 |
| F2h Z+ATT (hot leak) | 0.214 ± 0.009 | 0.175 ± 0.011 | 0.542 ± 0.012 | 0.528 ± 0.015 | 0.228 ± 0.009 | 0.063 ± 0.003 |
| F3s sparse diag b15 | 0.194 ± 0.010 | 0.139 ± 0.010 | 0.494 ± 0.013 | 0.470 ± 0.016 | 0.227 ± 0.010 | 0.063 ± 0.003 |
| F4 F3s+ATT teacher audio | 0.219 ± 0.010 | 0.163 ± 0.011 | 0.555 ± 0.013 | 0.536 ± 0.016 | 0.245 ± 0.009 | 0.070 ± 0.003 |
| F5 F3s+nonaudio(recent,lang) | 0.196 ± 0.010 | 0.140 ± 0.010 | 0.518 ± 0.013 | 0.494 ± 0.017 | 0.231 ± 0.009 | 0.068 ± 0.003 |
| F6 F3s+ATT noisy audio 0.5sd | 0.215 ± 0.010 | 0.158 ± 0.011 | 0.554 ± 0.013 | 0.535 ± 0.016 | 0.243 ± 0.009 | 0.069 ± 0.003 |
| F4h F3s+ATT (hot leak) | 0.290 ± 0.011 | 0.243 ± 0.012 | 0.640 ± 0.012 | 0.652 ± 0.015 | 0.275 ± 0.009 | 0.080 ± 0.003 |
| F5h F3s+nonaudio (hot leak) | 0.268 ± 0.011 | 0.216 ± 0.012 | 0.605 ± 0.012 | 0.614 ± 0.015 | 0.266 ± 0.009 | 0.079 ± 0.003 |
| F6b F3s+ATT noisy audio 1.0sd | 0.204 ± 0.009 | 0.153 ± 0.010 | 0.541 ± 0.013 | 0.527 ± 0.017 | 0.241 ± 0.009 | 0.068 ± 0.003 |
| F4a F3s+audio only | 0.214 ± 0.009 | 0.157 ± 0.011 | 0.528 ± 0.012 | 0.507 ± 0.016 | 0.234 ± 0.009 | 0.066 ± 0.003 |
| F3s sparse diag b12 | 0.172 ± 0.009 | 0.120 ± 0.009 | 0.477 ± 0.013 | 0.453 ± 0.016 | 0.217 ± 0.010 | 0.057 ± 0.003 |
| F3s sparse diag b13 | 0.183 ± 0.009 | 0.127 ± 0.009 | 0.484 ± 0.013 | 0.463 ± 0.016 | 0.223 ± 0.010 | 0.060 ± 0.003 |
| F3s sparse diag b14 | 0.191 ± 0.009 | 0.137 ± 0.010 | 0.492 ± 0.013 | 0.468 ± 0.016 | 0.226 ± 0.010 | 0.062 ± 0.003 |
| F3s idf-weighted b15 | 0.180 ± 0.009 | 0.112 ± 0.009 | 0.470 ± 0.013 | 0.430 ± 0.016 | 0.219 ± 0.010 | 0.056 ± 0.003 |
| F4 idf-weighted +ATT | 0.201 ± 0.009 | 0.132 ± 0.009 | 0.543 ± 0.013 | 0.503 ± 0.017 | 0.238 ± 0.009 | 0.066 ± 0.003 |
| F3d dense b15 k64 | 0.047 ± 0.003 | 0.037 ± 0.004 | 0.160 ± 0.007 | 0.156 ± 0.009 | 0.115 ± 0.008 | 0.024 ± 0.002 |
| F3d dense b15 k128 | 0.078 ± 0.005 | 0.060 ± 0.005 | 0.235 ± 0.008 | 0.244 ± 0.012 | 0.166 ± 0.009 | 0.034 ± 0.003 |
| F3d dense b15 k256 | 0.111 ± 0.006 | 0.075 ± 0.007 | 0.322 ± 0.010 | 0.309 ± 0.013 | 0.199 ± 0.010 | 0.043 ± 0.003 |
| F3d dense b15 k1024 | 0.168 ± 0.009 | 0.120 ± 0.009 | 0.439 ± 0.012 | 0.422 ± 0.016 | 0.229 ± 0.010 | 0.059 ± 0.003 |
| F3d dense b12 k128 | 0.078 ± 0.005 | 0.049 ± 0.004 | 0.243 ± 0.008 | 0.246 ± 0.011 | 0.157 ± 0.009 | 0.033 ± 0.003 |
| F4d dense k256 +ATT | 0.131 ± 0.007 | 0.093 ± 0.007 | 0.441 ± 0.011 | 0.429 ± 0.015 | 0.221 ± 0.009 | 0.054 ± 0.003 |
| F4d dense k1024 +ATT | 0.142 ± 0.007 | 0.103 ± 0.008 | 0.457 ± 0.011 | 0.439 ± 0.015 | 0.238 ± 0.009 | 0.062 ± 0.003 |
| F3s TS tau0.02 | 0.194 ± 0.010 | 0.139 ± 0.010 | 0.494 ± 0.013 | 0.470 ± 0.016 | 0.227 ± 0.010 | 0.062 ± 0.003 |
| F3s abl -album | 0.186 ± 0.009 | 0.133 ± 0.010 | 0.490 ± 0.013 | 0.469 ± 0.016 | 0.226 ± 0.009 | 0.062 ± 0.003 |
| F3s abl -title words | 0.171 ± 0.009 | 0.119 ± 0.010 | 0.469 ± 0.013 | 0.442 ± 0.017 | 0.217 ± 0.010 | 0.061 ± 0.003 |
| F3s abl -artistxlang | 0.194 ± 0.009 | 0.138 ± 0.010 | 0.493 ± 0.013 | 0.469 ± 0.016 | 0.227 ± 0.010 | 0.062 ± 0.003 |
| F3s abl -artist | 0.201 ± 0.010 | 0.142 ± 0.010 | 0.499 ± 0.013 | 0.480 ± 0.017 | 0.212 ± 0.009 | 0.054 ± 0.003 |
| F3s abl -composer | 0.186 ± 0.009 | 0.135 ± 0.010 | 0.489 ± 0.013 | 0.467 ± 0.016 | 0.227 ± 0.010 | 0.063 ± 0.003 |
| F3s abl -label | 0.159 ± 0.009 | 0.107 ± 0.008 | 0.456 ± 0.012 | 0.420 ± 0.016 | 0.222 ± 0.009 | 0.059 ± 0.003 |
| F3s abl -year | 0.125 ± 0.008 | 0.096 ± 0.009 | 0.356 ± 0.012 | 0.345 ± 0.015 | 0.201 ± 0.009 | 0.053 ± 0.003 |
| F3s abl -lang | 0.095 ± 0.006 | 0.066 ± 0.006 | 0.239 ± 0.010 | 0.217 ± 0.013 | 0.198 ± 0.009 | 0.051 ± 0.003 |
| F3s abl base(a,m,lb,lg,y,d,al) | 0.169 ± 0.009 | 0.121 ± 0.010 | 0.469 ± 0.013 | 0.443 ± 0.017 | 0.217 ± 0.010 | 0.059 ± 0.003 |
| F3s abl base minus album | 0.160 ± 0.009 | 0.112 ± 0.009 | 0.451 ± 0.013 | 0.422 ± 0.016 | 0.215 ± 0.010 | 0.059 ± 0.003 |
| R0 plain TF-IDF (fit on warm) | 0.104 ± 0.007 | 0.135 ± 0.009 | 0.374 ± 0.011 | 0.492 ± 0.015 | 0.184 ± 0.009 | 0.061 ± 0.003 |

**Retention vs F0 (no-hot-leak F0)** (quality retained vs `F0 full [Z,E,.75A,ATT]`, ratio of means, bootstrap s.e.)

| config | P1 all | P1 cold | P2 all | P2 cold |
|---|---|---|---|---|
| F1 Z only (fit on warm) | 50% ± 2 | 144% ± 15 | 60% ± 2 | 86% ± 3 |
| F2 Z+ATT (no E) | 58% ± 2 | 168% ± 16 | 68% ± 2 | 91% ± 3 |
| F3s sparse diag b15 | 58% ± 2 | 153% ± 15 | 75% ± 2 | 103% ± 4 |
| F4 F3s+ATT teacher audio | 65% ± 2 | 180% ± 17 | 81% ± 2 | 114% ± 4 |
| F5 F3s+nonaudio(recent,lang) | 58% ± 2 | 154% ± 15 | 76% ± 2 | 111% ± 4 |
| F6 F3s+ATT noisy audio 0.5sd | 64% ± 2 | 175% ± 17 | 80% ± 2 | 113% ± 4 |
| F4h F3s+ATT (hot leak) | 87% ± 3 | 268% ± 28 | 90% ± 2 | 130% ± 5 |
| F5h F3s+nonaudio (hot leak) | 80% ± 3 | 238% ± 25 | 87% ± 2 | 129% ± 5 |
| F0h full (hot leak) | 106% ± 1 | 103% ± 1 | 107% ± 1 | 106% ± 2 |

## 2. Hybrid / learner check (rand 25%)

**Hybrid designs (not stateless: contain Z/E)** (rand0.25, n clusters P1/P2 all=516/437, cold=345/426)

| config | P1 nDCG@20 all | P1 nDCG@20 cold | P1 R@100 all | P1 R@100 cold | P2 hit all | P2 hit cold |
|---|---|---|---|---|---|---|
| F0 dense ridge (ref) | 0.335 ± 0.011 | 0.091 ± 0.010 | 0.693 ± 0.011 | 0.389 ± 0.019 | 0.304 ± 0.011 | 0.061 ± 0.004 |
| F4 F3s+ATT teacher audio | 0.219 ± 0.010 | 0.163 ± 0.011 | 0.555 ± 0.013 | 0.536 ± 0.016 | 0.245 ± 0.009 | 0.070 ± 0.003 |
| F0 diag-learner | 0.335 ± 0.011 | 0.091 ± 0.010 | 0.693 ± 0.011 | 0.389 ± 0.019 | 0.265 ± 0.010 | 0.064 ± 0.004 |
| H hybrid F0+F3s(w0.5) diag | 0.339 ± 0.011 | 0.094 ± 0.011 | 0.698 ± 0.011 | 0.400 ± 0.019 | 0.271 ± 0.010 | 0.067 ± 0.004 |
| H hybrid F0+F3s(w0.5)+ATT-s diag | 0.337 ± 0.011 | 0.095 ± 0.011 | 0.701 ± 0.011 | 0.413 ± 0.019 | 0.274 ± 0.010 | 0.070 ± 0.004 |
| H hybrid F0+F3s(w1.0) diag | 0.338 ± 0.011 | 0.105 ± 0.011 | 0.702 ± 0.011 | 0.434 ± 0.019 | 0.278 ± 0.010 | 0.072 ± 0.004 |
| H hybrid F0+F3s(w1.0)+ATT-s diag | 0.333 ± 0.011 | 0.106 ± 0.011 | 0.705 ± 0.011 | 0.463 ± 0.018 | 0.278 ± 0.010 | 0.074 ± 0.004 |
| H hybrid dense F0 + hashed k1024 (w0.5) | 0.338 ± 0.011 | 0.094 ± 0.011 | 0.697 ± 0.011 | 0.398 ± 0.019 | 0.315 ± 0.011 | 0.066 ± 0.004 |

## 3. Cold share / new-release scenarios (lite grid, 3 folds)

**10% of songs cold** (rand0.1, n clusters P1/P2 all=516/300, cold=130/274)

| config | P1 nDCG@20 all | P1 nDCG@20 cold | P1 R@100 all | P1 R@100 cold | P2 hit all | P2 hit cold |
|---|---|---|---|---|---|---|
| F0 full [Z,E,.75A,ATT] | 0.360 ± 0.011 | 0.106 ± 0.020 | 0.732 ± 0.011 | 0.340 ± 0.034 | 0.331 ± 0.014 | 0.030 ± 0.003 |
| F1 Z only (fit on warm) | 0.166 ± 0.009 | 0.129 ± 0.018 | 0.450 ± 0.013 | 0.391 ± 0.030 | 0.192 ± 0.012 | 0.027 ± 0.002 |
| F2 Z+ATT (no E) | 0.193 ± 0.009 | 0.152 ± 0.021 | 0.518 ± 0.013 | 0.409 ± 0.031 | 0.221 ± 0.012 | 0.029 ± 0.002 |
| F3s sparse diag b15 | 0.194 ± 0.010 | 0.135 ± 0.021 | 0.494 ± 0.013 | 0.427 ± 0.030 | 0.235 ± 0.012 | 0.030 ± 0.002 |
| F4 F3s+ATT teacher audio | 0.219 ± 0.010 | 0.162 ± 0.023 | 0.555 ± 0.013 | 0.452 ± 0.031 | 0.254 ± 0.012 | 0.035 ± 0.002 |
| F5 F3s+nonaudio(recent,lang) | 0.196 ± 0.010 | 0.139 ± 0.021 | 0.518 ± 0.013 | 0.447 ± 0.031 | 0.238 ± 0.012 | 0.034 ± 0.002 |
| F6 F3s+ATT noisy audio 0.5sd | 0.215 ± 0.010 | 0.159 ± 0.023 | 0.554 ± 0.013 | 0.463 ± 0.030 | 0.252 ± 0.012 | 0.033 ± 0.002 |

**25% cold** (rand0.25, n clusters P1/P2 all=516/437, cold=345/426)

| config | P1 nDCG@20 all | P1 nDCG@20 cold | P1 R@100 all | P1 R@100 cold | P2 hit all | P2 hit cold |
|---|---|---|---|---|---|---|
| F0 full [Z,E,.75A,ATT] | 0.335 ± 0.011 | 0.091 ± 0.010 | 0.693 ± 0.011 | 0.389 ± 0.019 | 0.304 ± 0.011 | 0.061 ± 0.004 |
| F1 Z only (fit on warm) | 0.166 ± 0.009 | 0.131 ± 0.010 | 0.453 ± 0.013 | 0.441 ± 0.016 | 0.184 ± 0.009 | 0.053 ± 0.003 |
| F2 Z+ATT (no E) | 0.195 ± 0.009 | 0.153 ± 0.011 | 0.519 ± 0.013 | 0.501 ± 0.016 | 0.206 ± 0.009 | 0.056 ± 0.003 |
| F3s sparse diag b15 | 0.194 ± 0.010 | 0.139 ± 0.010 | 0.494 ± 0.013 | 0.470 ± 0.016 | 0.227 ± 0.010 | 0.063 ± 0.003 |
| F4 F3s+ATT teacher audio | 0.219 ± 0.010 | 0.163 ± 0.011 | 0.555 ± 0.013 | 0.536 ± 0.016 | 0.245 ± 0.009 | 0.070 ± 0.003 |
| F5 F3s+nonaudio(recent,lang) | 0.196 ± 0.010 | 0.140 ± 0.010 | 0.518 ± 0.013 | 0.494 ± 0.017 | 0.231 ± 0.009 | 0.068 ± 0.003 |
| F6 F3s+ATT noisy audio 0.5sd | 0.215 ± 0.010 | 0.158 ± 0.011 | 0.554 ± 0.013 | 0.535 ± 0.016 | 0.243 ± 0.009 | 0.069 ± 0.003 |

**50% cold** (rand0.5, n clusters P1/P2 all=516/300, cold=468/300)

| config | P1 nDCG@20 all | P1 nDCG@20 cold | P1 R@100 all | P1 R@100 cold | P2 hit all | P2 hit cold |
|---|---|---|---|---|---|---|
| F0 full [Z,E,.75A,ATT] | 0.279 ± 0.010 | 0.116 ± 0.010 | 0.629 ± 0.011 | 0.476 ± 0.015 | 0.279 ± 0.013 | 0.127 ± 0.008 |
| F1 Z only (fit on warm) | 0.165 ± 0.009 | 0.154 ± 0.009 | 0.451 ± 0.013 | 0.456 ± 0.014 | 0.195 ± 0.012 | 0.113 ± 0.007 |
| F2 Z+ATT (no E) | 0.193 ± 0.009 | 0.176 ± 0.010 | 0.518 ± 0.012 | 0.529 ± 0.013 | 0.217 ± 0.012 | 0.120 ± 0.007 |
| F3s sparse diag b15 | 0.194 ± 0.010 | 0.169 ± 0.010 | 0.494 ± 0.013 | 0.492 ± 0.014 | 0.235 ± 0.012 | 0.128 ± 0.007 |
| F4 F3s+ATT teacher audio | 0.219 ± 0.010 | 0.191 ± 0.010 | 0.555 ± 0.013 | 0.559 ± 0.014 | 0.254 ± 0.012 | 0.139 ± 0.007 |
| F5 F3s+nonaudio(recent,lang) | 0.196 ± 0.010 | 0.173 ± 0.010 | 0.518 ± 0.013 | 0.520 ± 0.014 | 0.238 ± 0.012 | 0.134 ± 0.007 |
| F6 F3s+ATT noisy audio 0.5sd | 0.215 ± 0.010 | 0.187 ± 0.010 | 0.554 ± 0.013 | 0.561 ± 0.014 | 0.252 ± 0.012 | 0.137 ± 0.007 |

**75% cold** (rand0.75, n clusters P1/P2 all=516/300, cold=355/300)

| config | P1 nDCG@20 all | P1 nDCG@20 cold | P1 R@100 all | P1 R@100 cold | P2 hit all | P2 hit cold |
|---|---|---|---|---|---|---|
| F0 full [Z,E,.75A,ATT] | 0.228 ± 0.010 | 0.155 ± 0.011 | 0.578 ± 0.012 | 0.542 ± 0.015 | 0.242 ± 0.012 | 0.168 ± 0.011 |
| F1 Z only (fit on warm) | 0.164 ± 0.009 | 0.176 ± 0.011 | 0.455 ± 0.013 | 0.466 ± 0.015 | 0.191 ± 0.011 | 0.159 ± 0.010 |
| F2 Z+ATT (no E) | 0.195 ± 0.009 | 0.198 ± 0.012 | 0.516 ± 0.013 | 0.525 ± 0.015 | 0.216 ± 0.012 | 0.174 ± 0.010 |
| F3s sparse diag b15 | 0.194 ± 0.010 | 0.192 ± 0.012 | 0.494 ± 0.013 | 0.482 ± 0.015 | 0.235 ± 0.012 | 0.192 ± 0.010 |
| F4 F3s+ATT teacher audio | 0.219 ± 0.010 | 0.216 ± 0.012 | 0.555 ± 0.013 | 0.543 ± 0.015 | 0.254 ± 0.012 | 0.203 ± 0.010 |
| F5 F3s+nonaudio(recent,lang) | 0.196 ± 0.010 | 0.202 ± 0.012 | 0.518 ± 0.013 | 0.512 ± 0.016 | 0.238 ± 0.012 | 0.196 ± 0.010 |
| F6 F3s+ATT noisy audio 0.5sd | 0.215 ± 0.010 | 0.211 ± 0.012 | 0.554 ± 0.013 | 0.543 ± 0.015 | 0.252 ± 0.012 | 0.201 ± 0.010 |

**songs released in the last 12 months are cold (1503 songs, 15%)** (recent12, n clusters P1/P2 all=516/300, cold=123/157)

| config | P1 nDCG@20 all | P1 nDCG@20 cold | P1 R@100 all | P1 R@100 cold | P2 hit all | P2 hit cold |
|---|---|---|---|---|---|---|
| F0 full [Z,E,.75A,ATT] | 0.342 ± 0.012 | 0.012 ± 0.007 | 0.715 ± 0.012 | 0.124 ± 0.020 | 0.326 ± 0.015 | 0.030 ± 0.005 |
| F1 Z only (fit on warm) | 0.162 ± 0.009 | 0.016 ± 0.007 | 0.459 ± 0.013 | 0.208 ± 0.023 | 0.190 ± 0.012 | 0.022 ± 0.004 |
| F2 Z+ATT (no E) | 0.191 ± 0.009 | 0.016 ± 0.006 | 0.520 ± 0.013 | 0.260 ± 0.026 | 0.216 ± 0.012 | 0.030 ± 0.005 |
| F3s sparse diag b15 | 0.194 ± 0.010 | 0.023 ± 0.007 | 0.494 ± 0.013 | 0.197 ± 0.026 | 0.235 ± 0.012 | 0.045 ± 0.006 |
| F4 F3s+ATT teacher audio | 0.219 ± 0.010 | 0.041 ± 0.008 | 0.555 ± 0.013 | 0.304 ± 0.031 | 0.254 ± 0.012 | 0.057 ± 0.006 |
| F5 F3s+nonaudio(recent,lang) | 0.196 ± 0.010 | 0.038 ± 0.008 | 0.518 ± 0.013 | 0.273 ± 0.031 | 0.238 ± 0.012 | 0.054 ± 0.006 |
| F6 F3s+ATT noisy audio 0.5sd | 0.215 ± 0.010 | 0.039 ± 0.008 | 0.554 ± 0.013 | 0.305 ± 0.032 | 0.252 ± 0.012 | 0.059 ± 0.006 |

**last 24 months cold (2257, 22%)** (recent24, n clusters P1/P2 all=516/300, cold=160/194)

| config | P1 nDCG@20 all | P1 nDCG@20 cold | P1 R@100 all | P1 R@100 cold | P2 hit all | P2 hit cold |
|---|---|---|---|---|---|---|
| F0 full [Z,E,.75A,ATT] | 0.327 ± 0.012 | 0.008 ± 0.004 | 0.686 ± 0.012 | 0.108 ± 0.017 | 0.314 ± 0.015 | 0.025 ± 0.004 |
| F1 Z only (fit on warm) | 0.152 ± 0.008 | 0.005 ± 0.002 | 0.445 ± 0.013 | 0.072 ± 0.011 | 0.191 ± 0.012 | 0.019 ± 0.003 |
| F2 Z+ATT (no E) | 0.180 ± 0.009 | 0.007 ± 0.002 | 0.498 ± 0.012 | 0.090 ± 0.013 | 0.215 ± 0.012 | 0.019 ± 0.003 |
| F3s sparse diag b15 | 0.194 ± 0.010 | 0.007 ± 0.004 | 0.494 ± 0.013 | 0.061 ± 0.013 | 0.235 ± 0.012 | 0.049 ± 0.006 |
| F4 F3s+ATT teacher audio | 0.219 ± 0.010 | 0.008 ± 0.002 | 0.555 ± 0.013 | 0.087 ± 0.013 | 0.254 ± 0.012 | 0.055 ± 0.006 |
| F5 F3s+nonaudio(recent,lang) | 0.196 ± 0.010 | 0.004 ± 0.002 | 0.518 ± 0.013 | 0.068 ± 0.012 | 0.238 ± 0.012 | 0.052 ± 0.006 |
| F6 F3s+ATT noisy audio 0.5sd | 0.215 ± 0.010 | 0.010 ± 0.003 | 0.554 ± 0.013 | 0.084 ± 0.013 | 0.252 ± 0.012 | 0.055 ± 0.006 |

**25% of songs cold, ALL songs of the chosen artists (debut artists)** (newartist0.25, n clusters P1/P2 all=516/300, cold=361/300)

| config | P1 nDCG@20 all | P1 nDCG@20 cold | P1 R@100 all | P1 R@100 cold | P2 hit all | P2 hit cold |
|---|---|---|---|---|---|---|
| F0 full [Z,E,.75A,ATT] | 0.344 ± 0.011 | 0.116 ± 0.012 | 0.705 ± 0.011 | 0.434 ± 0.019 | 0.316 ± 0.014 | 0.055 ± 0.005 |
| F1 Z only (fit on warm) | 0.166 ± 0.009 | 0.166 ± 0.011 | 0.451 ± 0.013 | 0.492 ± 0.017 | 0.190 ± 0.011 | 0.049 ± 0.005 |
| F2 Z+ATT (no E) | 0.195 ± 0.009 | 0.179 ± 0.012 | 0.516 ± 0.013 | 0.551 ± 0.017 | 0.212 ± 0.012 | 0.055 ± 0.005 |
| F3s sparse diag b15 | 0.194 ± 0.010 | 0.172 ± 0.012 | 0.494 ± 0.013 | 0.494 ± 0.016 | 0.235 ± 0.012 | 0.065 ± 0.006 |
| F4 F3s+ATT teacher audio | 0.219 ± 0.010 | 0.188 ± 0.012 | 0.555 ± 0.013 | 0.547 ± 0.017 | 0.254 ± 0.012 | 0.074 ± 0.006 |
| F5 F3s+nonaudio(recent,lang) | 0.196 ± 0.010 | 0.176 ± 0.012 | 0.518 ± 0.013 | 0.513 ± 0.017 | 0.238 ± 0.012 | 0.067 ± 0.005 |
| F6 F3s+ATT noisy audio 0.5sd | 0.215 ± 0.010 | 0.187 ± 0.012 | 0.554 ± 0.013 | 0.549 ± 0.017 | 0.252 ± 0.012 | 0.073 ± 0.006 |

## 4. Per-language (playlists whose majority language is X; rand 25%)

**hindi** (clusters P1 all/cold, P2 all/cold = 101/71/83/81)

| config | P1 all | P1 cold | P2 all | P2 cold |
|---|---|---|---|---|
| F0 full [Z,E,.75A,ATT] | 0.335 ± 0.023 | 0.055 ± 0.015 | 0.304 ± 0.021 | 0.047 ± 0.009 |
| F1 Z only (fit on warm) | 0.139 ± 0.018 | 0.099 ± 0.022 | 0.158 ± 0.017 | 0.041 ± 0.007 |
| F2 Z+ATT (no E) | 0.168 ± 0.020 | 0.119 ± 0.024 | 0.177 ± 0.018 | 0.048 ± 0.007 |
| F3s sparse diag b15 | 0.187 ± 0.023 | 0.129 ± 0.019 | 0.207 ± 0.019 | 0.050 ± 0.007 |
| F4 F3s+ATT teacher audio | 0.207 ± 0.023 | 0.158 ± 0.022 | 0.224 ± 0.017 | 0.057 ± 0.006 |
| F5 F3s+nonaudio(recent,lang) | 0.189 ± 0.024 | 0.135 ± 0.021 | 0.206 ± 0.017 | 0.055 ± 0.006 |
| F6 F3s+ATT noisy audio 0.5sd | 0.206 ± 0.023 | 0.149 ± 0.022 | 0.218 ± 0.018 | 0.057 ± 0.006 |

**english**: only 1 playlist has english as majority language, so no estimate is possible (n/a).

**telugu** (clusters P1 all/cold, P2 all/cold = 63/38/62/60)

| config | P1 all | P1 cold | P2 all | P2 cold |
|---|---|---|---|---|
| F0 full [Z,E,.75A,ATT] | 0.323 ± 0.031 | 0.048 ± 0.023 | 0.314 ± 0.027 | 0.062 ± 0.012 |
| F1 Z only (fit on warm) | 0.162 ± 0.024 | 0.123 ± 0.029 | 0.187 ± 0.023 | 0.059 ± 0.010 |
| F2 Z+ATT (no E) | 0.199 ± 0.028 | 0.146 ± 0.032 | 0.212 ± 0.025 | 0.059 ± 0.010 |
| F3s sparse diag b15 | 0.175 ± 0.024 | 0.146 ± 0.031 | 0.228 ± 0.025 | 0.066 ± 0.011 |
| F4 F3s+ATT teacher audio | 0.199 ± 0.025 | 0.140 ± 0.030 | 0.244 ± 0.025 | 0.075 ± 0.012 |
| F5 F3s+nonaudio(recent,lang) | 0.175 ± 0.024 | 0.137 ± 0.029 | 0.231 ± 0.025 | 0.070 ± 0.012 |
| F6 F3s+ATT noisy audio 0.5sd | 0.195 ± 0.025 | 0.140 ± 0.032 | 0.240 ± 0.026 | 0.073 ± 0.012 |

**tamil** (clusters P1 all/cold, P2 all/cold = 67/42/62/60)

| config | P1 all | P1 cold | P2 all | P2 cold |
|---|---|---|---|---|
| F0 full [Z,E,.75A,ATT] | 0.371 ± 0.033 | 0.078 ± 0.031 | 0.302 ± 0.032 | 0.061 ± 0.011 |
| F1 Z only (fit on warm) | 0.179 ± 0.029 | 0.135 ± 0.031 | 0.184 ± 0.026 | 0.055 ± 0.009 |
| F2 Z+ATT (no E) | 0.216 ± 0.031 | 0.162 ± 0.033 | 0.204 ± 0.027 | 0.057 ± 0.009 |
| F3s sparse diag b15 | 0.223 ± 0.030 | 0.173 ± 0.033 | 0.213 ± 0.025 | 0.068 ± 0.010 |
| F4 F3s+ATT teacher audio | 0.270 ± 0.030 | 0.203 ± 0.035 | 0.230 ± 0.026 | 0.075 ± 0.010 |
| F5 F3s+nonaudio(recent,lang) | 0.225 ± 0.031 | 0.170 ± 0.032 | 0.220 ± 0.025 | 0.073 ± 0.010 |
| F6 F3s+ATT noisy audio 0.5sd | 0.269 ± 0.030 | 0.189 ± 0.034 | 0.233 ± 0.025 | 0.076 ± 0.010 |

**punjabi** (clusters P1 all/cold, P2 all/cold = 48/34/35/33)

| config | P1 all | P1 cold | P2 all | P2 cold |
|---|---|---|---|---|
| F0 full [Z,E,.75A,ATT] | 0.294 ± 0.037 | 0.081 ± 0.031 | 0.330 ± 0.047 | 0.072 ± 0.014 |
| F1 Z only (fit on warm) | 0.146 ± 0.023 | 0.082 ± 0.023 | 0.233 ± 0.051 | 0.064 ± 0.015 |
| F2 Z+ATT (no E) | 0.168 ± 0.027 | 0.115 ± 0.026 | 0.257 ± 0.051 | 0.072 ± 0.014 |
| F3s sparse diag b15 | 0.161 ± 0.030 | 0.109 ± 0.033 | 0.321 ± 0.054 | 0.077 ± 0.015 |
| F4 F3s+ATT teacher audio | 0.180 ± 0.035 | 0.128 ± 0.038 | 0.338 ± 0.051 | 0.083 ± 0.014 |
| F5 F3s+nonaudio(recent,lang) | 0.165 ± 0.033 | 0.113 ± 0.038 | 0.325 ± 0.051 | 0.082 ± 0.014 |
| F6 F3s+ATT noisy audio 0.5sd | 0.174 ± 0.034 | 0.124 ± 0.037 | 0.333 ± 0.050 | 0.084 ± 0.014 |
## 5. Cost (single thread numpy, 5,000 candidates; see latency.txt)

| design | floats / song stored | score 5,000 songs | learner update |
|---|---|---|---|
| F0 dense D=217 (Z,E,A,ATT) | 217 (868 B) + needs shipped index for all songs | 0.03 ms | 217x217 solve 0.22 ms |
| F3 dense k=128 | 128 | 0.02 ms | 0.09 ms |
| F3 dense k=1024 | 1024 | 0.43 ms | 1024 solve 9.4 ms |
| F3s sparse (2^15) | 0 stored, ~12.5 nnz recomputed from metadata | 0.05 ms | O(nnz) = ~13 adds |
| F4 sparse + 25 ATT | 25 floats from on-device audio + ~12.5 nnz | 0.14 ms | O(nnz) = ~38 adds |

Featurising 5,000 songs in pure python was 116 ms (Swift will be far faster; it is a few hash calls per song). State per mode: dense F0 184 KB vs diag 256 KB.

## 6. Conclusions

1. Quality kept vs the full F0 (paired, no hot leak, random 25% cold), P1 nDCG / P2 hit rate, all targets: Z-only 50% / 60%; Z+ATT 58% / 68%; best stateless sparse hashed (F3s) 58% / 75%; **F4 hashed+teacher audio+steer 65% / 81%**; F6 with noisy (0.5 sd) audio 64% / 80%; F5 (no audio) 58% / 76%.
2. On COLD targets (the new-song case) the stateless designs match or beat F0 because F0's `E` block is zero for cold songs and its warm songs outrank them: P2 cold F4 0.070 vs F0 0.061 (+0.009 ± 0.002 paired; 114%), P1 cold nDCG F4 0.163 vs 0.091 (+0.072 ± 0.009; 180%). The collaborative signal is what the stateless model gives up on warm songs (-0.116 P1, -0.059 P2 on all targets).
3. Hashing beats the fitted SVD at equal "no-CF" footing: F3s - Z-only = +0.028 ± 0.007 P1-all, +0.043 ± 0.005 P2-all, +0.011 P2-cold, with zero fitted state.
4. Keep it SPARSE. Random projection to dense 64/128/256 dims destroys it (P1-all 0.047/0.078/0.111 vs 0.194; even k=1024 only 0.168 and 4 KB/song). bucket count: 2^12 0.172, 2^13 0.183, 2^14 0.191, 2^15 0.194, 2^16+ no further gain.
5. Plain weights beat idf-weighting (P1 cold 0.139 vs 0.112; paired +0.013 ± 0.005 / +0.027 ± 0.007), so no shipped idf table is needed.
6. Audio is worth including but only modestly: F4 - F5 = +0.023 ± 0.003 P1-all, +0.014 ± 0.002 P2-all, +0.002 ± 0.001 P2-cold; relative to hashed-only F3s +13% P1 / +8% P2. Weight audio low (0.3; at 0.5-1.0 it hurt). Noisy audio (0.5 sd) retains ~80% of that gain, 1.0 sd ~35-70%. The recency/language steer columns give more of the P2-cold gain than audio does (F5 - F3s = +0.005).
7. Degradation with cold share: the stateless model is flat by construction; F0 falls as cold share grows (P2-all 0.331 -> 0.304 -> 0.279 for 10/25/50% cold, section 3). For genuinely new releases (last 12 months cold) everyone is poor on P1-cold (F0 0.012, F4 0.041 nDCG) and F4 still leads on P2-cold (0.057 vs 0.030); a debut-artist scenario (artist tokens unseen) keeps F4 at 0.188 P1-cold / 0.074 P2-cold vs F0 0.116 / 0.055.
8. Hybrid (not stateless, section 2): appending F3s to F0 gives P1-cold +0.014 and P2-cold +0.005 to +0.013 with P1-all unchanged; the diag learner itself loses ~0.04 P2-all vs the dense ridge on F0 (0.265 vs 0.304), while a dense learner on F0+hashed k=1024 keeps P2-all 0.315. The practical design is "F0 for catalogue songs, hashed+ATT block appended so that never-seen songs get a real score".
9. Recommendation: ship F4 (2^15 signed-hash buckets, weights above, no idf, DiagBayes lam0 1.0, 25 audio/steer columns scaled 0.3/1.0, noisy-audio tolerant). If the catalogue index stays available for known songs, use the hybrid on top; for songs missing from the index use the F4 block alone.
10. Caveats: see below.

### Caveats (what could make these numbers optimistic or misleading)

* Playlist crawls contain near-duplicate playlists (same editorial lists in several folds), which benefits `E`/CF on warm songs and the artist/album tokens; cold masks remove only song memberships, not duplicate-playlist structure for the *warm* seeds.
* Random cold masks keep the artist, album and label of a cold song warm; real new songs often have new artists. The `newartist` scenario (all songs of chosen artists cold) is the pessimistic bound and F4 still leads there, but new songs with new composers, labels and albums are rarer than either scenario.
* `hot` leaks the target (fresh playlists = eval playlists); main rows drop it. The `recent` coordinate is derived from release dates and is legitimate, but in the recent-release scenario every cold song has recency~1, which is itself an informative feature.
* Teacher audio attributes come from the same offline analysis as `A`; the noisy variant (iid Gaussian, 0.5/1.0 sd) is a weak proxy for a real on-device model whose errors are correlated.
* Hyper-parameters (token weights, lam, wT) were tuned on fold 0 only, whose playlists stay in the training set of folds 1-3 (mild); the same F0 weights (0.75 A, 0.5 ATT) were tuned on dev too. F0's cold performance could be raised by a cold-aware gating of E (not tried).
* P2 cold removes warm playlist members from the pool, making the task easier than the real catalogue; absolute cold hit rates (0.03-0.14) depend on that pool and on the cold share (hit rate grows with the number of cold targets), so compare columns within a scenario, not across scenarios. english: only 1 majority-english playlist exists, so no english numbers are reported (n/a).
* P1 uses cosine to a centroid (no negatives); the app's learner is richer.
