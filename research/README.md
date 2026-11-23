# research

Offline experiments and write-ups behind the iOS app's recommender. This folder is **not part of the shipped app**:
nothing here is built into `apps/ios`, imported by it, or deployed. Python is used only for analysis.

- `docs/RESULTS.md` and `docs/experiments/`: findings and the reasoning behind the design.
- `recs/`: the pipeline scripts (crawl, features, benchmarks, simulations). Start with `recs/README.md`.
- `recs/experiments/`: the experiment scripts, plus the 312 KB Core ML student used by experiment 2.

Running a script (Python 3.9+; `uv` needs no project file):

```sh
mkdir -p ~/scratch/recs-data && cd ~/scratch/recs-data        # scripts read and write data/ relative to the cwd
uv run --with numpy --with scipy --with scikit-learn python ~/dev/songs/research/recs/bench.py data/playlists.jsonl
```

Audio scripts also need `--with essentia-tensorflow`; see `recs/README.md` for the models and the full run order.

**Scratch directory.** The experiment scripts in `recs/experiments/` read and write their intermediate data (`data/`,
`exp1/`, `exp2/`) under one scratch root. It defaults to `recs/.work/` (git-ignored); set `RECS_WORK=/path` to put it
elsewhere, e.g. `RECS_WORK=~/scratch/recs-work python3 recs/experiments/gen_report.py`. The directory is created on demand.
The supply scripts use `SUPPLY_DIR` instead (see `recs/README.md`).
Crawls hit the live JioSaavn API, so run them only when you need fresh data.
