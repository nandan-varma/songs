# exp2: distilling the Essentia teacher into a tiny on-device student

Setup: 10,746 clips decoded exactly like the teacher (essentia MonoLoader, 16 kHz). The teacher has outputs for 10,029 of them (9,052 with arousal/valence/bpm). 3-fold out-of-fold (OOF) split by song, fixed seed. Input is a 64-mel log spectrogram (n_fft 1024, hop 512, 469 frames), cached as float16. PCA is fit per training fold. All numbers below are held-out OOF.

Budget cut (machine was heavily loaded): only the ~150k "small" CNN was trained, 12 epochs/fold (OneCycle, AdamW, random 300-frame crop + gain aug, best-val checkpoint). The ~600k "large" net was NOT trained (config in net.py; ~2x slower). A larger or longer-trained student would probably do somewhat better, so treat these as a floor.

## Per-target fidelity (OOF vs teacher)
| target | student R2 | student r | student rho | student R2 (center 300-frame crop) | DSP ridge R2 | DSP ridge r | DSP HistGB R2 | DSP HistGB r |
|---|---|---|---|---|---|---|---|---|
| voice | 0.602 | 0.778 | 0.782 | 0.588 | 0.396 | 0.629 | 0.487 | 0.699 |
| danceable | 0.757 | 0.870 | 0.898 | 0.747 | 0.594 | 0.771 | 0.654 | 0.809 |
| happy | 0.699 | 0.837 | 0.848 | 0.690 | 0.564 | 0.751 | 0.628 | 0.793 |
| sad | 0.839 | 0.916 | 0.910 | 0.832 | 0.697 | 0.835 | 0.774 | 0.880 |
| relaxed | 0.782 | 0.885 | 0.898 | 0.772 | 0.646 | 0.804 | 0.703 | 0.838 |
| party | 0.800 | 0.895 | 0.908 | 0.791 | 0.670 | 0.818 | 0.718 | 0.848 |
| acoustic | 0.785 | 0.886 | 0.891 | 0.775 | 0.628 | 0.792 | 0.675 | 0.822 |
| electronic | 0.666 | 0.817 | 0.815 | 0.652 | 0.492 | 0.701 | 0.533 | 0.731 |
| arousal | 0.867 | 0.931 | 0.931 | 0.860 | 0.801 | 0.895 | 0.848 | 0.921 |
| valence | 0.879 | 0.938 | 0.940 | 0.874 | 0.840 | 0.917 | 0.865 | 0.930 |
| bpm | 0.042 | 0.209 | 0.202 | 0.042 | 0.044 | 0.209 | 0.097 | 0.315 |

Spearman for DSP ridge is in dsp.log. bpm is essentially unlearnable here for either: the teacher's RhythmExtractor bpm is octave-noisy and the student was not given a tempo-specific path. Do not rely on student tempo.

64-d embedding PCA (compared in a common global teacher PCA basis; student predicts per-fold PCA coords, reconstructed to 1280-d, then projected):
| model | mean cosine | R2 |
|---|---|---|
| student (full 469 frames) | 0.702 | 0.517 |
| student (300 frames) | 0.694 | 0.511 |
| DSP ridge | 0.626 | 0.389 |
| DSP HistGB | 0.677 | 0.478 |

## Size, speed, Core ML
- Student: 151,227 params; float16 295 KB; .mlpackage (mlprogram, fp16, fixed 1x1x64x469 input, normalisation and de-standardisation baked in) 312 KB at S/exp2/student.mlpackage (converted from the fold-0 model; basis in student_pca_basis_fold0.npz).
- Output: 75 values: 11 attrs in teacher units, then 64 PCA coords in the fold-0 basis.
- Parity on 50 clips (Core ML CPU_ONLY fp16 vs PyTorch fp32): max abs diff 0.084, all of it on the bpm output (unit ~100 BPM); probability attrs <=0.0015, arousal/valence <=0.008, PCA coords <=0.005.
- Latency (this Mac, loaded): Core ML CPU-only median 0.40 ms/clip (NOT the Neural Engine, not an iPhone); PyTorch CPU 3 threads median 2.6 ms/clip. Mel front-end is extra: ~30 ms/clip for my numpy/librosa path (not optimised; on device use vDSP/Accelerate).
- Training time: 700 s / 385 s / 322 s per fold (variable because of machine load), 12 epochs each, 3 threads.
- Audio features for the DSP baseline: 151 handcrafted features (RMS, dynamic range, centroid/rolloff/flux/ZCR/flatness, onset rate, tempo estimate, band ratios, MFCC mean/std/delta, contrast, chroma, mean/std mel), computed in about 100 s for the whole set. Nothing to ship but code, but the quality is worse.

## Downstream simulation (sim_final.py harness, same leak-free split: 150 held-out playlists, 10 rounds x 5-song slates, same metadata features hot/recent/language in every row)
"harness-seed" uses the harness seeds; "3-seed" averages three seed sets per playlist. wA = weight of PCA(64) audio block, wT = weight of attribute block. Paired diff is vs teacher at wA=0.5,wT=0.5 (3-seed, per-playlist pairing).

| config | harness-seed hit-rate | 3-seed avg | paired diff vs teacher (0.5,0.5) |
|---|---|---|---|
| NO audio (content+CF+metadata) | 0.2635 ± 0.0168 | 0.2589 ± 0.0158 | -0.0504 ± 0.0052 |
| teacher 0.5/0.5 | 0.3060 ± 0.0167 | 0.3092 ± 0.0164 | 0 |
| student 0.5/0.5 | 0.3063 ± 0.0168 | 0.3056 ± 0.0166 | -0.0037 ± 0.0030 |
| DSP 0.5/0.5 | 0.3005 ± 0.0172 | 0.3021 ± 0.0164 | -0.0071 ± 0.0032 |
| noisy 1x (student-matched indep. noise) 0.5/0.5 | 0.3035 ± 0.0167 | 0.3019 ± 0.0162 | -0.0074 ± 0.0028 |
| noisy 2x 0.5/0.5 | 0.2995 ± 0.0169 | 0.2967 ± 0.0161 | -0.0125 ± 0.0033 |
| teacher 0.5/1.0 | 0.3177 ± 0.0168 | 0.3173 ± 0.0164 | +0.0080 ± 0.0039 |
| student 0.5/1.0 | 0.3139 ± 0.0172 | 0.3173 ± 0.0167 | +0.0080 ± 0.0043 |
| DSP 0.5/1.0 | 0.3105 ± 0.0175 | 0.3138 ± 0.0167 | +0.0046 ± 0.0041 |
| noisy 1x 0.5/1.0 | 0.3037 ± 0.0170 | 0.3064 ± 0.0164 | -0.0028 ± 0.0039 |
| noisy 2x 0.5/1.0 | 0.2979 ± 0.0171 | 0.2963 ± 0.0164 | -0.0129 ± 0.0042 |
| teacher 0.5/0 (A only) | 0.2756 ± 0.0166 | 0.2772 ± 0.0159 | -0.0321 ± 0.0043 |
| student 0.5/0 | 0.2743 ± 0.0165 | 0.2744 ± 0.0157 | -0.0349 ± 0.0045 |
| DSP 0.5/0 | 0.2764 ± 0.0168 | 0.2752 ± 0.0159 | -0.0340 ± 0.0046 |
| teacher 0/0.5 (attrs only) | 0.2899 ± 0.0167 | 0.2894 ± 0.0161 | -0.0199 ± 0.0032 |
| student 0/0.5 | 0.2909 ± 0.0164 | 0.2905 ± 0.0158 | -0.0188 ± 0.0036 |
| DSP 0/0.5 | 0.2920 ± 0.0171 | 0.2906 ± 0.0161 | -0.0186 ± 0.0039 |
| student A + teacher attrs | 0.3101 ± 0.0169 | 0.3080 ± 0.0163 | -0.0013 ± 0.0027 |
| teacher A + student attrs | 0.3113 ± 0.0168 | 0.3131 ± 0.0161 | +0.0038 ± 0.0023 |

The s.e. in the first columns is across playlists (between-playlist variance, large); the paired column is the meaningful one. Audio of any kind is worth about +0.045-0.05 absolute; the student/DSP/teacher differences are at most 1 s.e. to 2 s.e. (DSP -0.007 and noisy-1x -0.007 are about 2.3-2.6 s.e. below the teacher; student -0.004 is 1.2 s.e.; at wT=1.0 the student ties the teacher). Not a significance claim between student and DSP.

## Steering use-cases (OOF, vs teacher, songs in the teacher set)
| metric | student | DSP ridge | noisy-1x (reference) |
|---|---|---|---|
| Spearman on voice | 0.782 | 0.651 | 0.716 |
| teacher top-100 most instrumental found in model's top-300 | 0.58 | 0.48 | 0.72 |
| model's top-50 "Less vocals" picks with teacher voice < 0.1 | 0.72 | 0.42 | 0.76 |
| mean teacher voice of model's top-50 (random 0.80, teacher's own top-50 0.015) | 0.087 | 0.168 | 0.078 |
| Spearman on arousal | 0.931 | 0.901 | 0.941 |
| teacher top-100 highest arousal found in model's top-300 | 0.72 | 0.61 | 0.89 |
| mean teacher-arousal percentile of model's top-50 "More energy" | 98.4% | 95.2% | 98.8% |

Note: the top-100/top-300 overlap is harsh because the teacher's voice probability is saturated near 0 for many songs (ties); the practical measures are the precision of the top-50 picks and the mean teacher voice (0.087 vs 0.80 random).

## Caveats
- Student is only as good as the teacher's labels; both are trained/evaluated on 56 kbps mono 15 s JioSaavn previews, mostly Indian film music; no check on other genres/sources or on full-length audio. Teacher outputs (esp. DEAM arousal/valence, bpm) are themselves noisy.
- Only the small model, 12 epochs, 3 folds (see above); no hyper-parameter search; the PCA/embedding path is the weakest (cos 0.70).
- OOF means every prediction came from a model that never saw that song, but the shipped model would be trained on everything; the converted model is fold 0 only.
- Latency was measured on a heavily loaded Mac, CPU-only, not on an iPhone/Neural Engine; the mel front end must be re-implemented in Swift and numerically matched (log-mel parity with librosa not tested here).
- 717 of 10,746 clips have no teacher output and were excluded from training and evaluation.
- The sim s.e. is dominated by playlist variance (150 playlists); differences of ~0.005 are not distinguishable. Student/DSP attrs are in student_attrs.npy / dsp_attrs.npy (build_feats scale: arousal=(a-5)/4, valence=(v-5)/4, tempo=bpm/220; emb_pca in a global teacher PCA basis).

Files: research/recs/experiments/{prep,common,dsp,net,train,convert,sim_attrs}.py (uncommitted); S/exp2/{student.mlpackage,student_attrs.npy,dsp_attrs.npy,oof_small.npy,sim_results.json,steer.json,*.log}.
