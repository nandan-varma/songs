# Exp3 results: on-device handling of new songs (no hosted, growing catalog)

Date of measurements: 2026-11-22. Machine: Apple M4 Mac, headless, no simulator. Scripts (uncommitted): `/Users/nandan/dev/web/music/music-api/tools/recs/experiments/` (snd.swift, supply.py, supply2.py, clipavail.py, coreml_bench.py). Analysis: `exp3/anA.py`, raw output `exp3/A_out.txt`.

## A. Apple SoundAnalysis built-in classifier vs. Essentia teacher

Setup: 400 clips, 142 with teacher p_voice<0.4, 172 with >0.9 (stratified by language over 12 languages; sample over-represents the rare instrumental end: 35.5% of sample <0.4 vs 9.5% of the 10,029-song catalog). `SNClassifySoundRequest(.version1)` over `SNAudioFileAnalyzer`, 9 windows per 15 s clip, mean and max confidence per class. 303 classes (`exp3/classes.txt`). Features = log(mean+max conf) of all classes, ridge (RidgeCV), 5-fold CV.

Runtime: mean 0.080 s per 15 s clip (median 0.079) including mp3 decode, on M4 CPU/ANE. 400 clips in 32 s. iPhone figure not measured (estimate 2-4x slower, still < 0.5 s/clip).

Relevant class names: `singing`, `speech`, `music`, `humming`, `rapping`, `choir_singing`, `yodeling`, `whistling`, `chatter`, `orchestra`, `piano`, `guitar`, `acoustic_guitar`, `electric_guitar`, `bass_guitar`, `drum`, `drum_kit`, `tabla`, `sitar`, `flute`, `violin_fiddle`, `saxophone`, `synthesizer`, `keyboard_musical`, `harmonium` is NOT in the list, `tambourine`, `percussion`, `plucked_string_instrument`, `wind_instrument`, `brass_instrument`. (No genre/mood classes.)

Single-class predictors of teacher p_voice (n=400, sample not population weighted):

| class (mean over windows) | Pearson | Spearman | AUC for "teacher instrumental (p_voice<0.5)" using low value |
|---|---|---|---|
| singing | 0.703 | 0.647 | 0.847 |
| singing (max) | 0.694 | 0.605 | 0.843 |
| music | -0.568 | -0.607 | 0.820 (inverted) |
| speech | 0.430 | 0.576 | 0.819 |
| rapping (best single AUC) | 0.374 | 0.660 | 0.850 |
| humming | 0.393 | 0.429 | 0.756 |
| choir_singing | 0.355 | 0.470 | 0.773 |
| tabla / piano / synthesizer / orchestra | -0.20 / -0.13 / -0.10 / 0.00 | | 0.47-0.53 (useless) |

Ridge on all classes, 5-fold CV (n=400; arousal/valence n=358 because the teacher lacks them for some songs):

| teacher target | Pearson | Spearman | R2 (CV) |
|---|---|---|---|
| voice (p_voice) | 0.850 | 0.856 | 0.721 |
| danceability | 0.775 | 0.821 | 0.601 |
| relaxed | 0.799 | 0.835 | 0.639 |
| party | 0.836 | 0.852 | 0.699 |
| acoustic | 0.800 | 0.810 | 0.639 |
| electronic | 0.702 | 0.697 | 0.492 |
| arousal | 0.828 | 0.841 | 0.686 |
| valence | 0.865 | 0.871 | 0.748 |
| happy | 0.762 | 0.800 | 0.581 |
| sad | 0.833 | 0.815 | 0.693 |

AUC for teacher-instrumental (p_voice<0.5):

| predictor | AUC |
|---|---|
| best single class (rapping mean) | 0.850 |
| `mean_singing` alone | 0.847 |
| ridge, all classes (CV) | 0.952 (logistic 0.926) |
| ridge, population-reweighted to catalog strata | 0.929 |
| ridge, extremes only (<0.4 vs >0.9) | 0.982 |
| ridge, ambiguous band 0.2<=p_voice<=0.8 (n=124) | 0.798 |

Operational test ("Less vocals" = show the lowest-scoring tracks): lowest 5%/10% of ridge predictions: 100% truly teacher p_voice<0.5; lowest 20%: 99% (<0.4: 95%). Per language ridge AUC: punjabi 1.00 (n=25), malayalam 0.99, kannada 0.985, hindi 0.96, tamil 0.96, marathi 0.92, telugu 0.91, bengali 0.875 (n=31; per-language n is small, noisy).

Caveats: (1) the "truth" is the Essentia model, not human labels, so numbers are agreement with the teacher; (2) ridge weights (~600 numbers) are a one-time artefact trained on the 10k teacher labels; (3) sample over-weights extremes; the population-weighted Pearson for voice is 0.785; (4) CV was random folds, not grouped by artist/album, so slight optimism; (5) other genres of "voice" (chorus, humming backing, rap) are the ambiguous region (AUC 0.80).

Verdict A: As a ranking signal for "Less vocals" it is trustworthy at the extremes (top of the list is ~100% truly instrumental per the teacher). Single classes are only AUC about 0.85; the ridge over all 303 class scores gets about 0.93-0.95 AUC and reproduces mood/energy attributes at Pearson 0.70-0.87 (R2 0.5-0.75), so it works as a zero-hosting replacement teacher with a small shipped weight file. It is not reliable for borderline songs (AUC 0.80 in the 0.2-0.8 band) and cannot match the Essentia models' calibration. It is also available only on iOS 15+/macOS 12+ (not a concern at iOS 26).

## B. Supply and background-refresh budget (project API wrapper)

Requests used: about 400 (< 600 cap), 0.3 s spacing. Note: the wrapper does not expose `webapi.getLaunchData` new_albums; "new releases" here = `/api/trending?type=album` + top-3 albums via `/api/albums`. Charts exposed by the wrapper are 9 playlists, all Hindi/India only (3 fetched). Channels: 40, first 6 fetched (language-agnostic).

(1) One-day snapshot per language (distinct songs; "not in catalog" = vs the 10,029 shipped ids):

| language | distinct today | not in catalog | released <=30 d | released <=90 d |
|---|---|---|---|---|
| hindi | 172 (trending 24, new-album 28, charts 3 lists, channels 55) | 49 | 6 | 14 |
| english | 54 | 49 | 3 | 3 |
| punjabi | 42 | 25 | 0 | 16 |
| tamil | 42 | 10 | 0 | 0 |
| telugu | 68 | 45 | 2 | 17 |
| bengali | 43 | 24 | 0 | 2 |
| marathi | 175 (151 are from one large new-album, inflated) | 151 | 0 | 0 |
| kannada | 33 | 13 | 4 | 6 |
| malayalam | 69 | 34 | 5 | 5 |
| gujarati | 26 | 1 | 0 | 0 |
| all | 724 distinct (689 with date) | 401 (55%) | 20 | 63 |

Interpretation: 55% of today's popular songs are not in the shipped catalog, but that mostly reflects that the catalog is a 10k sample of back-catalog: only 3 of the 386 dated off-catalog songs are <=30 days old and 32 are <=90 days; median age 4,296 days. Genuinely new releases surfaced by these endpoints are only about 20 per 30 days across all 10 languages (about 0.7/day total). Tamil/Gujarati are almost fully covered; English and Marathi least. Day-over-day churn could not be measured (single snapshot); not verified.

(2) `/api/songs/{id}/suggestions` (150 random catalog seeds): 141/150 (94%) returned >=5 results; 3 returned 0; median 16, mean 14.3. 2,142 suggestions, 66% not in catalog, 1,315 distinct new songs from 150 calls (8.8 new songs per call); 77 of them <=90 d old, 250 <=365 d; spread across hindi, kannada, marathi, telugu, tamil, bengali, bhojpuri, punjabi. So suggestions are the large supply source (back-catalog and neighbours), trending/new-albums is the small fresh source.

(3) Metadata of a never-seen song (60 sampled off-catalog songs via `/api/songs?ids=`, batches of 20 per call): name 60/60, year 60/60, releaseDate 60/60, duration 60/60, label 60/60, language 60/60, playCount 60/60 (median 101,957), copyright 60/60, album id+name 60/60, artists with ids 60/60 (roles: music (composer) 118 entries, singer 89, starring 120, lyricist 64, primary_artists 153, featured_artists 7; every sample had a `music` role). hasLyrics true 10/60. List endpoints (trending etc.) carry the same schema with `downloadUrl` in 99.9%.

Clip availability:

| source | availability | size | time |
|---|---|---|---|
| raw upstream `song.getDetails` -> `more_info.vlink` (the 15 s jiotune preview our teacher used) | 53/60 present, 52/60 downloaded OK (87-88%) | median 122 KB | mean 1.9 s per clip download |
| wrapper `downloadUrl` (full tracks, 12/48/96/160/320 kbps, 60/60 have all 5) | 60/60 | 96 kbps median 2.8 MB | 3.9 s mean per full track |
| HTTP Range on the wrapper 96 kbps URL (first 200 KB) | 60/60 got 206 | 200 KB (about 16 s) | 0.13 s mean |

Important findings: the wrapper does NOT expose `vlink`, so previews today need raw upstream (or a one-field wrapper change, which I did not make since src is off limits). Range-truncated MP4 (moov at the front, mdat cut) is decodable by ffmpeg but `afinfo`/CoreAudio refused to open it (also after patching the mdat size), so on-device decoding of a truncated range is NOT verified; AVPlayer/AVAssetReader on the remote URL not tested. The vlink mp3 previews decode fine (our existing clips).

(4) Budget per user (estimates from the measured per-item numbers; preview 122 KB; details 1 API call per 20 ids; 5 suggestion seeds per language per day):

| scenario | new songs/day | download | API calls/day | on-device analysis (SoundAnalysis 0.08 s/clip on M4; phone est. 0.2-0.3 s) |
|---|---|---|---|---|
| 1 language, light | 30 | 3.7 MB | about 41 (1 trending + 3 albums + 2 details + 5 suggestions + 30 clips) | 2.4 s (est. 6-9 s on phone) |
| 3 languages | 90 | 11 MB | about 123 | 7 s (est. 18-27 s) |
| 3 languages, heavy | 300 | 37 MB | about 400 | 24 s (est. 60-90 s) |
| fresh-only (<=30 d) trending | about 1-2 | < 0.3 MB | about 15 | negligible |

What iOS allows (Apple docs, fetched from developer.apple.com documentation JSON):
- BGAppRefreshTaskRequest: "short refresh task"; the system chooses launch time and gives up to 30 seconds ("Choosing background strategies for your app": https://developer.apple.com/documentation/backgroundtasks/choosing-background-strategies-for-your-app). Needs `fetch` background mode (https://developer.apple.com/documentation/backgroundtasks/bgapprefreshtask). `earliestBeginDate` is only a lower bound, no guarantee (https://developer.apple.com/documentation/backgroundtasks/bgtaskrequest/earliestbegindate); the delay to launch "can be many hours" (https://developer.apple.com/documentation/backgroundtasks/starting-and-terminating-tasks-during-development). Apple DTS in forums says frequency is driven by device condition and user activity, rarely-used apps may get none (https://developer.apple.com/forums/thread/729824, forum, not formal doc).
- BGProcessingTaskRequest: "can take minutes", runs only when the device is idle and is terminated when the user starts using it (https://developer.apple.com/documentation/backgroundtasks/bgprocessingtask); `requiresNetworkConnectivity` / `requiresExternalPower` are booleans that restrict it (properties documented as "Boolean specifying if the processing task requires network connectivity / a device connected to power"). Needs `processing` mode. No published minutes figure: not verified.
- BGContinuedProcessingTask (iOS 26): must start in the foreground in response to a person's action, shows a Live Activity with progress, the user can cancel, the system may terminate low-progress tasks; can use network and CPU (GPU needs a Background GPU entitlement) (https://developer.apple.com/documentation/backgroundtasks/performing-long-running-tasks-on-ios-and-ipados, https://developer.apple.com/documentation/backgroundtasks/bgcontinuedprocessingtask). Suitable only for an explicit "Update my music" button, not silent refresh.
- Audio-playing apps: the `audio` background mode keeps audio running when the app is backgrounded or the device locked (https://developer.apple.com/documentation/avfoundation/configuring-your-app-for-media-playback). I found NO documentation granting audio apps extra BGTask budget; the practical point (inference, not documented) is that while music is playing the process stays alive, so a refresh of a few MB can run opportunistically then.
- Force-quit apps do not get background launches (forum DTS, not formal doc). Task count caps exist (`BGTaskScheduler.Error.Code.tooManyPendingTaskRequests`), exact number not verified.

Recommended refresh design (no hosted growth):
1. Foreground-first: on app open (at most once per 12-24 h) run a refresh pass with a budget of about 30 songs per chosen language; this is the reliable path.
2. BGAppRefreshTask (daily request, resubmitted each run) for metadata only: trending + 3 new albums + `/songs?ids=` batch, no audio, within 30 s; store metadata and a "needs analysis" flag.
3. BGProcessingTask with `requiresNetworkConnectivity=true`, `requiresExternalPower=true` (overnight) to download 122 KB previews and run SoundAnalysis/Core ML, resumable per song (checkpoint every song; expiration handler saves state). Cap to 30-90 songs per run.
4. Use suggestions of songs the user liked in a mode as the main source of "new to us" songs (8.8 new per call, 94% of seeds return >=5), trending only for freshness.
5. Optional: BGContinuedProcessingTask for a "Refresh now" button only.
6. Previews need `vlink` from `song.getDetails`: either call upstream directly (undocumented, may change) or add one field `previewUrl` to the wrapper (the wrapper is already hosted by the owner and stateless, no growth). Analyze lazily just before a new song is first recommended.

## C. Licences and Core ML path

Findings with sources:

| item | licence found | source |
|---|---|---|
| Essentia library | Affero GPLv3 "for non-commercial applications"; commercial licence available from MTG-UPF | https://essentia.upf.edu/licensing_information.html ; repo badge AGPL-3.0 https://github.com/MTG/essentia |
| Essentia pretrained models (MTG-created: Discogs-EffNet, voice/instrumental, mood and danceability heads, MusiCNN heads, DEAM arousal/valence heads) | CC BY-NC-SA 4.0, "also available under proprietary license upon request" | https://essentia.upf.edu/models.html |
| CONFLICT inside Essentia's own docs | `https://essentia.upf.edu/models/LICENSE` (the licence file hosted with the .pb files, UPF 2019-2021) says CC BY-NC-ND 4.0 (NoDerivatives), while the models page and licensing page say BY-NC-SA 4.0; the GitHub `MTG/essentia-models` repo reports NOASSERTION. Per-model JSON metadata has no licence field. | https://essentia.upf.edu/models/LICENSE |
| MusiCNN code | ISC (jordipons/musicnn); the MSD-MusiCNN weights distributed by Essentia fall under the Essentia model licence above (not separately verified) | https://github.com/jordipons/musicnn |
| DEAM / MUSAV training data | not checked; the DEAM head's licence is as the MTG heads above | unverified |
| CC BY-NC-SA 4.0 text | NonCommercial = "not primarily intended for or directed towards commercial advantage or monetary compensation"; ShareAlike applies to Adapted Material you share; the text does not mention model outputs | https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.en |

Student trained on Essentia output labels, bundled in an app: legally unsettled, my reading (not legal advice): (a) personal builds on your own device and private TestFlight to friends are low risk; (b) the labels are outputs, and the CC text does not say outputs are Adapted Material, so a student trained only on labels is arguably not a derivative of the weights, but nobody has tested this, and the "NC" intent and the ND/SA conflict above make it a risk for a public App Store release, especially a paid or monetized one; (c) lowest-risk options: ask MTG-UPF for the proprietary licence (contact via essentia.upf.edu), or avoid Essentia-derived labels in the shipped path. Separate issue to keep in mind: the audio itself is JioSaavn's copyrighted content (clips, previews), outside this question.

Alternatives:

| option | licence | size / on-device suitability |
|---|---|---|
| Apple SoundAnalysis built-in classifier | part of the OS, no model to ship (Apple SDK terms) | zero bytes; measured in A: usable for voice/energy/mood proxy (AUC 0.93-0.95) |
| Classic DSP (MFCC, spectral centroid/flux, onset rate, tempo via Accelerate/vDSP) | no licence issue if written from scratch | tiny; weaker semantics, not measured here |
| OpenL3 | code MIT, weights CC BY 4.0 (https://github.com/marl/openl3) | about 18 MB-class CNN (size not verified); too large and 6 s windows; usable via Core ML conversion but heavier |
| PANNs CNN14 (AudioSet) | repo MIT; checkpoints on Zenodo CC BY 4.0 (https://zenodo.org/records/3987831, https://github.com/qiuqiangkong/audioset_tagging_cnn) | CNN14 about 80 M params (large); MobileNet variants (MobileNetV1 about 4 M) exist in the same repo; AudioSet classes also include singing |
| LAION CLAP | repo CC0-1.0 (GitHub API); HF checkpoints `laion/clap-htsat-unfused`, `laion/larger_clap_music` apache-2.0 (HF API) | HTSAT audio tower + text tower, hundreds of M params; too big for background use on phone |
| MERT-v1-95M | CC BY-NC 4.0 (HF API: https://huggingface.co/m-a-p/MERT-v1-95M) | non-commercial, 95 M params; not suitable |
| MIT AST (AudioSet) | bsd-3-clause on HF, 86.6 M params | too large |
| Microsoft MSCLAP | MS-PL on HF | not evaluated for size |

Core ML tooling facts:
- coremltools is BSD-3-Clause (GitHub API). PyPI wheels exist for cp39 in 9.0, 8.3 and 8.1 (checked via PyPI JSON; 9.0 installed in the project venv alongside torch 2.8.0 with Python 3.9.6 and converted a torch.jit.trace model fine). Python 3.13 wheels exist only from 9.0 (also referenced in executorch PR https://github.com/pytorch/executorch/pull/16004). scikit-learn 1.6.1 emits a warning (conversion API for sklearn disabled; irrelevant for torch).
- Latency measured (Mac, Apple M4, coremltools predict from Python, fp16 mlprogram, iOS17 target, 223,264-param 4-block conv net on 1x1x64x470 log-mel, median of 100 after warm-up):

| compute units | median ms | p90 ms | load s |
|---|---|---|---|
| CPU only | 0.64 | 0.71 | 0.05 |
| CPU+GPU | 1.60 | 1.82 | 0.12 |
| CPU+Neural Engine | 0.20 | 0.23 | 0.18 |

  This is a Mac M4 number including Python call overhead; an iPhone with ANE should be in the same order of magnitude (estimate: about 0.3-1 ms per 5 s window; a 15 s clip as 3 windows, about 1-3 ms, plus mel extraction on vDSP). Apple publishes no standard figures; Xcode's Core ML Performance Report / Instruments Core ML template measures on a device. Third-party blog numbers (MobileNetV3-Small 1-3 ms ANE) are unverified (https://3nsofts-site.pages.dev/insights/core-ml-inference-performance-benchmarks-2026). Model file size about 0.45 MB fp16.

Verdict C: Essentia models and library are non-commercial licensed with conflicting statements in Essentia's own pages; fine for personal/TestFlight experimentation, a risk for a public App Store release unless you obtain MTG's proprietary licence or avoid them. The Apple SoundAnalysis path in A is the licence-clean one, and a student net is small enough for the Neural Engine by a wide margin (compute is not the bottleneck; the training labels' licence is).

## Overall recommendation for new songs with no hosted catalog

1. Ship, once, a tiny weight file: ridge/logistic (about 600 numbers) mapping Apple SoundAnalysis class confidences to the existing attribute vector (voice, danceability, relaxed, party, acoustic, electronic, arousal/valence proxy). Retrain from the 10k teacher labels; no hosting growth.
2. New song flow on the phone: get metadata from the wrapper (title/artists/composer/label/year/playCount), get a preview clip (needs `vlink` exposed), run SoundAnalysis 0.08 s (Mac) per clip, apply weights, add to local store. Songs whose clip fails (about 12%) fall back to metadata-only features (artist/composer/language/era) and are never ranked by "Less vocals".
3. Keep the Essentia path out of the shipped binary unless the licence question is resolved.

Risks: teacher agreement is not human truth; borderline-vocal songs are unreliable; preview URL not in wrapper and upstream endpoint is undocumented; Range-truncated MP4 not decodable by CoreAudio (not verified on AVPlayer); BG task timing is not guaranteed; Essentia licence texts conflict; phone-side SoundAnalysis speed and ridge accuracy on the iOS decoder/resampler (mp3 vs aac) not measured; single-day supply snapshot only.
