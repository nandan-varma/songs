# Recommendation research pipeline

Reproduces `research/docs/RESULTS.md`. Offline only: nothing here ships with `apps/ios`, and the app no longer bundles
a song catalogue (the old `export_index.py` and `check_catalog.py` were removed with it).
Python 3.9+, `numpy scipy scikit-learn essentia-tensorflow` (the experiment 2/3 scripts also need `torch coremltools`).
Run everything from a scratch **data directory** (scripts use `data/` relative paths), not from this folder. Models live in
`models/` (download from essentia.upf.edu/models: `discogs-effnet-bs64-1`, `msd-musicnn-1`, `deam-msd-musicnn-2` and the
`*-discogs-effnet-1` heads voice_instrumental, danceability, mood_happy/sad/aggressive/relaxed/party/acoustic/electronic,
tonal_atonal).

Running with uv, from the scratch directory (no project file is needed):

```sh
cd ~/scratch/recs-data
uv run --with numpy --with scipy --with scikit-learn python ~/dev/songs/research/recs/bench.py data/playlists.jsonl
```

Add `--with essentia-tensorflow` for the audio scripts.

1. `crawl.py`, `crawl_instr.py`   crawl playlists → `data/playlists*.jsonl`
2. `bench.py`                     signal comparison (section 1)
3. `fetch_all.py`, `analyze2.py <shard> <of>`   preview clips → audio features `data/feat2_*.npy`
4. `bench_audio.py`, `sim.py`, `sim_final.py`, `text.py`, `enrich.py`   sections 2–5

`experiments/` holds the scripts behind `research/docs/experiments/` (stateless features, audio student, Apple signals).
They import `build_feats.py` from this folder, so run them with the scratch directory as the working directory.

`experiments/supply.py` and `supply2.py` compare the catalogue with live API supply. They need the catalogue file, which is
not in the repo (it is in the archive bundle): pass it as the first argument, or set `CATALOG_JSON`. `SUPPLY_DIR` (default:
the current directory) is where they read `data/` and write `exp3/`. For example:

```sh
SUPPLY_DIR=~/scratch/recs-data python3 research/recs/experiments/supply.py /path/to/archive/catalog.json   # stdlib only
```
