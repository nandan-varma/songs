# Experiments toward a learned song encoder

Offline experiments run to decide how the app should score songs that are not in its fixed catalog, without hosting
anything that grows. Scripts are in `tools/recs/experiments/`. Numbers come from playlist-based proxies (a playlist stands in
for a listener's taste), not real listening, so they rank approaches rather than predict product metrics.

| # | Question | File |
|---|---|---|
| 1 | How much quality do stateless, hashed metadata features keep? | `01-hashed-metadata-features.md` |
| 2 | Can a tiny on-device model reproduce the audio attributes? | `02-audio-student.md` |
| 3 | What can Apple's sound classifier do, how much new music is there, and what are the licence limits? | `03-apple-signals-supply-licences.md` |

Reading guide: experiment 1's "F4" (hashed sparse metadata + a low-weighted audio block) is the baseline the learned encoder
has to beat, especially on cold songs. Experiment 3's licence notes concern shipping Essentia-derived labels; they do not
limit running experiments.

`tools/recs/experiments/artifacts/student.mlpackage` is the 312 KB Core ML student from experiment 2 (fold 0, trained on Essentia-derived labels, so treat it as an educational artefact; the shipped model would be retrained on everything).
