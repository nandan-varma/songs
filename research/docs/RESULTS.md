# Personalized recommendations — what was measured

Everything below was measured on real JioSaavn data (904 crawled playlists, 17,645 songs; 3,708 songs with audio
analysis). Playlists stand in for a listener's taste: reveal a few songs as "likes", ask a method to find the rest.
That is a proxy, not real listening behaviour — treat the numbers as a ranking of approaches, not as product metrics.
Reproduce with the scripts in `research/recs/`.

## 1. Which signals predict taste (playlist continuation, 5 seed likes, nDCG@20 ± s.e.)

Same-artist/same-album candidates are excluded in the strict column, because many playlists are one artist or one
album and that shortcut makes everything look good.

| Method | all candidates | same artist excluded |
|---|---|---|
| Popularity (play count or playlist frequency) | 0.001–0.005 | 0.004 |
| EASE (collaborative, closed form) | 0.107 ± 0.009 | 0.090 ± 0.009 |
| PPMI + SVD item embeddings | 0.126 ± 0.008 | 0.105 ± 0.009 |
| ItemKNN co-occurrence | 0.140 ± 0.010 | 0.129 ± 0.010 |
| Metadata TF-IDF (artist, composer, album, label, language, year) | 0.265 ± 0.010 | 0.134 ± 0.008 |
| **Learned stack of the above** (logistic regression fit on validation playlists) | **0.287 ± 0.010** | **0.185 ± 0.010** |

* **Popularity is useless as a ranker.** Any "trending" default fails the test.
* Collaborative signals alone are weak on public playlists: 58 % of held-out songs never appear in training playlists.
* A learned combination beats every single signal. Weights were fit on held-out data, not hand-tuned.

## 2. Does audio help? (15 s preview clips, Essentia Discogs-EffNet)

| Method | nDCG@20 |
|---|---|
| Metadata only | 0.315 ± 0.011 |
| Audio embedding only | 0.104 ± 0.006 |
| Metadata + 0.5 × audio | **0.376 ± 0.011** |
| Metadata + 1.0 × audio | 0.252 ± 0.009 |

Audio alone is a poor "more like these" signal (playlists are grouped by artist/era, not sound) but a small dose
improves ranking, and it is the only source for steerable attributes:

* **Voice detector works**: songs titled "instrumental" score 0.27 mean voice probability (93 % below 0.5) against
  0.81 for the catalog.
* Mood heads track playlist titles (workout/party playlists: danceable 0.89, party 0.75; sad playlists: sad 0.50 vs 0.18).
* The catalog is ~90 % vocal. "Less vocals" only has an effect if instrumentals are in the pool, so the crawl adds
  instrumental / lofi / focus playlists.

## 3. Learning from feedback (simulated sessions: 1 seed, then 10 rounds of 5 songs, skips are explicit 60 % of the time)

Mean share of each slate the "user" would keep:

| Learner | hit rate |
|---|---|
| Random / popularity | 0.004 / 0.012 |
| Rocchio (mean of likes) | 0.170 ± 0.017 |
| Rocchio + negatives | 0.186 ± 0.018 |
| Bayesian ridge, posterior mean (chosen) | 0.198 ± 0.019 |
| **One shared model across two modes vs. one model per mode** | **0.045 vs 0.198** |

Per-mode isolation is not a nicety: mixing two distinct tastes into one learner is ~4× worse. Thompson-sampling
noise did not help on a static playlist (it cannot reward adapting to drift), so exploration is kept small and
unproven. *Superseded in the shipped app:* v1 has one hidden listener profile and no user-visible modes, so this table
measures evidence separation, not a product requirement to expose modes.

Feature-design check on the audio subset (CF built **without** the evaluation playlists — an earlier run leaked and
looked far better, see below): content+CF 0.364, +0.5 audio 0.386, +1.0 audio 0.394, audio alone 0.095.

## 4. Prompt → playlist without an LLM (query = held-out playlist title)

Song-text TF-IDF 0.114, JioSaavn's own playlist search 0.121 (n=40, ±0.036), retrieving similar playlist titles 0.039.
All weak: a plain text search is not enough, so the prompt needs expansion (on-device model or LLM). That part is
**untested** — no LLM was available during the study.

## 5. External enrichment is patchy

Matching JioSaavn songs to Deezer by title + duration found 47 % of a sample; ReccoBeats audio features then covered
36 % overall (Telugu 3 of 12). JioSaavn songs carry no ISRC. Deezer/iTunes genres are coarse ("Bollywood");
MusicBrainz tags are sparse and name-matching is fragile. Hence audio features are computed from JioSaavn's own
preview clip (`more_info.vlink`, 93 % coverage) instead.

## 6. Cold start

A mode with no evidence used to pick at random from the catalog, so the first songs were old. The fix is a prior that is
part of the model rather than a hand-sorted list: "hot right now" (from current charts / trending / new releases),
recency and the listener's languages are extra steerable coordinates, set by synthetic observations the same way a
*Less vocals* tap is. Listening evidence then moves them like any other weight (liking old songs lowers the recency
weight). Checked offline on the real index: with Hindi + English selected, the top-20 cold-start slate is entirely
2023–2026 releases (median year of the top 200: 2025). Catch: Hindi dominates the opening slate even with English
selected, because current charts hold more Hindi hits; a language-balanced opening slate is an open question.

## 7. Review-driven corrections to feedback signs

A code review of the first prototype found that skips and "not this mood" were encoded as `y = 0` against a prior mean of
0, which can never push a score below neutral, and that a skip at 40 % played counted as positive evidence. Targets are
now signed: listened fraction `f` maps to `2f − 1`, "not this mood" is −1, finishing is +1. A unit test asserts that a
rejection makes the weight negative.

## Mistakes caught while measuring

* The first benchmark's 0.92 hit rate was a same-album shortcut → added exclusion modes.
* The first feature-design simulation built CF embeddings from the evaluation playlists (0.54 → 0.36 once fixed).
* Small samples (n≈100) disagreed with the full run; every table above is from the full set with standard errors.

## Not measured / open

* Real listening behaviour. The event log in the iOS prototype exists to calibrate completion/skip weights from use.
* LLM prompt expansion; exploration under taste drift; Hindi-specific audio model quality.
* Licensing: Essentia models are AGPL, MuQ-MuLan weights CC-BY-NC, Yambda research-only — check before shipping commercially.
  JioSaavn's API is unofficial; bulk crawling and clip analysis may conflict with its terms.

## Round 2: on-device model comparison

Setup: 1,193 unique playlists (exact duplicates removed), 22,071 songs, 4 playlist folds (3 evaluated: n = 575-786 playlists with a
valid target). 5 seed likes, nDCG@20 ± s.e. over playlists; strict removes candidates (and targets) sharing an artist or album with a seed.
Cold items: 20 % of songs (or of primary artists) are removed from every training playlist and are the only candidates.
Models see only metadata tokens; CF and the encoder are built without the evaluation playlists. Still playlists, not listening.
Scripts: `research/recs/experiments/` (`run_cold.py`, `run_warm.py`, `run_sug.py`, `run_audio.py`, `sessions.py`, `cost_bench.swift`).

| Model (5 seeds, strict nDCG@20) | cold song | cold artist | warm pool | audio subset, cold song |
|---|---|---|---|---|
| A greedy (current, no noise) | 0.228 ± 0.011 | 0.258 ± 0.012 | 0.154 ± 0.007 | 0.288 ± 0.013 |
| A + Thompson 0.04 (shipped) | 0.217 ± 0.011 (-0.011 ± 0.005) | 0.232 ± 0.011 | - | - |
| C: ItemKNN from ≤20 runtime playlists | n/a (cold items have no co-occurrence) | n/a | 0.130 ± 0.008 | - |
| A + C (z-sum 1 : 0.5) | n/a | n/a | 0.202 ± 0.009 (+0.047 ± 0.008) | - |
| D alone (64-d encoder, Rocchio) | 0.208 ± 0.010 | 0.204 ± 0.010 | 0.193 ± 0.008 (+0.038 ± 0.008) | 0.291 ± 0.013 |
| **A + D (64 dense dims, scale 0.5, appended to the hashed vector)** | **0.272 ± 0.011 (+0.043 ± 0.007)** | 0.273 ± 0.012 (+0.015 ± 0.008) | 0.224 ± 0.008 (+0.070 ± 0.005) | 0.352 ± 0.014 (+0.064 ± 0.009) |
| A + D + C | - | - | 0.215 ± 0.009 (no gain over A + D) | - |
| E: A + D + 0.5 × audio (Discogs-EffNet PCA-64) | - | - | - | 0.398 ± 0.014 (+0.110 ± 0.011 vs A) |

Loose (same-artist allowed) nDCG, cold song: A 0.367, A + D 0.389 ± 0.011. Differences in parentheses are paired vs A.
Encoder hyperparameters (dim 32/64/128, steps, token dropout, MLP, temperature, different-artist pairs) moved A + D by less than 1 s.e.
on the validation fold, so defaults were kept. Scale 0.25 / 0.5 / 1.0 gives 0.260 / 0.272 / 0.244; 0.5 was best.

B (source signal), 612 playlists with real `/songs/{id}/suggestions` for 3 seeds + 200 popular songs in the seed language: a candidate that comes
from a seed's suggestions is relevant 6.1 % of the time vs 1.1 % for the popular pool. As an additive prior on top of A, strict nDCG
rises +0.008 ± 0.004 (β 0.1), +0.017 ± 0.006 (β 0.25, tuned on test, optimistic), then falls above β 0.5; used alone it is worse than A
(-0.10 ± 0.02). Suggestions ranked by their own order are not a good ranker, but a small prior is a cheap gain.

Per-language gap, cold song, strict, A → A + D (paired difference):
Hindi 0.196 → +0.061 ± 0.020 (n 107); Telugu 0.183 → +0.033 ± 0.019 (75); Tamil 0.214 → +0.058 ± 0.023 (62);
Punjabi 0.185 → +0.066 ± 0.016 (58); Kannada +0.044 ± 0.015; Bengali +0.051 ± 0.025; Marathi +0.057 ± 0.029; Malayalam +0.033 ± 0.033;
Bhojpuri +0.042 ± 0.030; Gujarati +0.032 ± 0.029; Haryanvi -0.084 ± 0.040 (n 27, A is strong there because playlists are single-artist).
Cold-artist: gains only in Bengali (+0.098 ± 0.026) and Marathi (+0.063 ± 0.027); Hindi +0.012, Punjabi +0.002 (no gain). English has 8
playlists in the crawl and 189 songs, so it is **not measured**.

Sessions (fold 0, 291 simulated listeners, 1 seed then 10 rounds of 5, language-filtered full pool, completion/favourite/skip/explicit
reject with 12 % noise on likes and 5 % tolerated dislikes, same artist/album diversity rules as the app). Absolute rates are low because
only the playlist's own ~30 songs count as hits among thousands:

| Learner | mean hit rate, static taste | mean hit rate, taste switches to another playlist after round 5 |
|---|---|---|
| A greedy | 0.075 ± 0.007 | 0.053 ± 0.004 |
| A current (Thompson 0.04) | 0.076 ± 0.006 (same as greedy) | 0.051 ± 0.004 |
| A + forgetting 0.97 / 0.90 per event | 0.071 / 0.062 (worse) | 0.049 / 0.047 (worse) |
| A + D (diag) | 0.086 ± 0.007 (+0.011 ± 0.005) | 0.056 ± 0.005 (+0.005 ± 0.004) |
| A + D (sparse part + full 64×64 Bayesian head) | 0.090 ± 0.007 (+0.015 ± 0.006) | 0.058 ± 0.005 (+0.007 ± 0.004) |
| A with 0.97 forgetting + D head | 0.090 ± 0.007 | 0.060 ± 0.005 (+0.009 ± 0.004) |

No variant recovers after a taste switch (post-switch hit rate 0.01-0.02 for all); time-to-good-slate is censored and does not separate models.
Artist diversity (distinct primary artists per slate item) is 0.74-0.83 for all. Thompson noise at 0.04 has no measurable effect on
hit rate, and costs -0.011 ± 0.005 in the static ranking test.

Cost (Mac M-series CPU, `-O` Swift + Accelerate, 500 candidates, synthetic weights, not on a phone):

| Item | Value |
|---|---|
| Shipped encoder | 20.8 k tokens × 64 fp16 = 2.7 MB (≈1.4 MB if the 3.1 k album tokens are dropped) + 0.38 MB token list |
| Embed 500 candidates (dictionary lookup, mean, normalise) | 0.38 ms |
| Score 500 (diagonal ridge, sparse + 64 dense dims) | 0.03 ms |
| Update per feedback event (diagonal) / dense rank-1 / dense posterior solve | 0.001 / 0.0002 / 0.006 ms |
| Dense Thompson sample + score 500 | 0.011 ms |
| Learner state | 0.26 MB diagonal + 16 KB dense |
| Audio student (223 k params, fp16 CoreML, 64×470 mel) | 0.38 ms CPU, 0.17 ms ANE per clip, plus the 15 s clip download and mel front end (not measured) |

Recommendation: ship **D appended to the existing hashed learner** (pure Swift, no CoreML, no hosting). The encoder is an embedding bag over the
same metadata tokens, trained once offline with in-batch contrastive loss on playlist co-occurrence, exported as `table_fp16.bin` +
`vocab.json` by `export_d.py`. On cold songs it is worth +0.043 ± 0.007 strict nDCG (+19 %) and +0.07 on the warm pool; it makes runtime
playlist co-occurrence (C) redundant. It does not fix cold artists or taste drift. Add the source prior from suggestions with a small weight.
Audio (E) adds about +0.05 more on the audio subset but needs a clip per candidate and the Essentia weights are CC BY-NC-SA (commercial
use needs a licence from MTG-UPF), so treat it as a later experiment. Forgetting did not help in the simulation.
Not verified: real listening behaviour, English, drift recovery, the audio student's fidelity to the teacher, on-phone latency, and whether the
quality holds for songs outside the crawled playlists (training data is 1.2 k playlists; more playlists should help the encoder).

### Round 2 addendum: runtime-faithful tokenisation (supersedes the Round 2 table)

The first Round 2 run tokenised crawled songs with all credited artists, a composer field, a comma-only primary artist and an ASCII-only
word splitter. The app (`SongFeatures`, `Payloads.swift`) uses only the first 2 primary artists joined by ", " (split again on "," and "&"),
never sets a composer, takes the `x|` primary from the first split name, and splits title words on non-letter/mark/number characters with a
grapheme-count of at least 2. Everything was re-run with the app's exact rules (`rdata.tokens_from_fields`; `verify_tokens/main.swift` checks
30 golden songs against the real `SongFeatures` with 0 mismatches). Strict nDCG@20, paired difference vs A:

| Setting | A | A + D | gain |
|---|---|---|---|
| Cold songs (n 604) | 0.216 ± 0.011 | 0.265 ± 0.011 | +0.049 ± 0.007 |
| Cold artists (n 575) | 0.247 ± 0.011 | 0.268 ± 0.012 | +0.022 ± 0.007 |
| Warm pool (n 786) | 0.146 ± 0.007 | 0.213 ± 0.008 | +0.067 ± 0.005 |

D alone: 0.202 (cold song), 0.191 (warm, +0.045 ± 0.008). Runtime co-occurrence C still adds nothing on top of A + D (0.212). Conclusions unchanged.
Thompson 0.04 costs -0.009 ± 0.005. Shipped export: 17,022 tokens (album tokens included, no composer tokens), 2.18 MB fp16 table, 0.31 MB vocab.
