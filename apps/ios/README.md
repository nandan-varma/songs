# Modes

A music app with one hidden on-device listener profile: the more you listen, the better For You gets.
SwiftUI, Swift 6, iOS 26+, with an Apple Music style expandable player ([LNPopupUI](https://github.com/LeoNatan/LNPopupUI)).

Songs are live from the JioSaavn API, not a fixed on-device catalogue. Every song — including one released today — is
featurised from its metadata on the phone, so it can be scored and learned from immediately.

## How it works

* **Live candidates** — selected languages bring trending songs; favorites and recents seed `/songs/{id}/suggestions`;
  artists, albums, playlists and charts come from the API. The 10k catalogue is only an offline fallback.
* **Hashed metadata, no per-song index** — artist, composer, album, label, language, year, artist×language and title
  words are signed-hashed into 2^15 buckets. A new song has a vector the moment its metadata arrives.
* **One learner, hidden** — a diagonal-precision Bayesian linear model over the hashed features. Finishing is a yes,
  skipping early is a no, *Suggest less* is a strong no, and Thompson sampling gives calibrated exploration. There are
  no visible modes or tuning controls.
* **Everything on device** — learner state, favorites and logs stay on the phone. The network is only used for songs,
  metadata and artwork via the JioSaavn API in this repo.

## Status

Initial-release feature set is in: onboarding by language, a model-ranked For You slate with an automatic queue,
an Apple Music style player (swipe the pill to change songs, swipe the cover right to love or left to suggest less,
swipe down to collapse), Library (favorites, recently played, local playlists), undo, sleep timer, share, AirPlay, background playback
with lock-screen controls, Siri / Shortcuts / Action Button transport actions, and Settings for languages, sound,
paused learning, swipe actions, resetting the profile and a Model statistics debug page. Search browses albums,
playlists, artists and charts; each opens a collection screen whose songs play as their own queue. Source is JioSaavn through the API in this repo; there is no
sync and no server of ours.

Parked on branch `perf/playback-engine` (unit-tested and reviewed, never run on a device): a preloading playback engine
(next/previous warmed for a couple of seconds), an off-main coalescing learning queue, an image pipeline and a launch shell.

## Layout

```
Modes/Core        playback, persistence, logging, orchestration (AppModel)
Modes/UI/Features  screens grouped by Home, Search, Library, Player, Settings, Onboarding
Modes/UI/Components shared artwork, headers, song rows, feedback, text and layouts
Modes/UI/DesignSystem  typography, colors, list styling and spacing
Modes/UI/Navigation    app tabs and root routing
Modes/Resources   catalog.json + catalog.bin (generated, see tools/recs)
Packages/ModesCore  learner, catalog, recommender — pure Swift, tested on the Mac with `swift test`
tools/make_icon.py  app icon generator
```

## Build, test, run

```sh
# logic tests: command line only, no simulator
cd Packages/ModesCore && swift test

# compile against the device SDK
helpers xcode build . --opts '{"destination":"device"}'

# install on a connected iPhone
helpers xcode run . --opts '{"destination":"device","args":["-allowProvisioningUpdates","-configuration","Release"]}'

# regenerate the Xcode project after editing project.yml
xcodegen generate
```

The catalog is built by the pipeline in `tools/recs` (crawl → audio analysis → `export_index.py`). Verify that its songs
really play with `python tools/recs/check_catalog.py Modes/Resources/catalog.json`.

## Listening log

Every event (completed, skipped, favorite, suggest less) is appended to `Documents/events.jsonl`; export it from
Settings → Your data. The weights for completion and skip signals are the thing to calibrate from real use.

## Dev loop

Everything needed to debug from the device without a simulator or a console. Tools live in `tools/dev` (see its README).

```sh
tools/dev/ios-pull.sh --shots --state && python3 tools/dev/ios-summary.py latest   # logs, crashes, screenshots, stats
tools/dev/ios-run.sh --capture --debug-log                                          # run with console + screenshots (restarts the app)
tools/dev/check.sh                                                                  # tests, lint, device build in parallel
```

**Logs.** `AppLog` writes JSON lines to `Documents/logs/modes-<UTC stamp>.jsonl` from one background queue (buffered, flushed
every 2 s, at 32 lines, immediately on warn/error and on backgrounding). Files rotate at 1 MB; the newest 3 are kept.
Fields: `ts` (UTC ISO 8601, ms), `level` (`debug` `info` `warn` `error` `metric`), `cat`, `msg`, `session` (6 hex chars per
launch), `seq`, optional `kv`. `debug` records need `MODES_LOG_DEBUG=1` or a DEBUG build. `MODES_LOG_STDOUT=1` echoes to stdout.

```json
{"ts":"2026-11-22T18:02:11.482Z","level":"info","cat":"session","msg":"session_start","session":"3fa9c1","seq":1,"kv":{"app_version":"0.1.0","build":"1","device":"iPhone18,1","previous_clean":true,"thermal":"nominal"}}
{"ts":"2026-11-22T18:02:14.907Z","level":"metric","cat":"metric","msg":"ttfa_ms","session":"3fa9c1","seq":40,"kv":{"unit":"ms","value":412.3}}
{"ts":"2026-11-22T18:02:15.001Z","level":"error","cat":"player","msg":"resolve failed","session":"3fa9c1","seq":41,"kv":{"id":"kehuVn2F","status":403}}
```

API: `AppLog.debug/info/warn/error(cat, msg, kv?)`, `AppLog.metric(name, value, unit:, tags:)`, and `let s = AppLog.span("rank_ms")`
… `s.end()`, which logs the elapsed milliseconds as a metric of that name and also emits an `OSSignposter` interval
(subsystem `com.nandanvarma.modes`, category `perf`) visible in Instruments.

**Stable metric names** (all milliseconds, `unit:"ms"`): `ttfa_ms` (tap or auto-advance to first audio), `skip_latency_ms`
(tap to UI showing the next song), `resolve_ms`, `rank_ms`, `learn_ms`, `save_state_ms`, `catalog_load_ms`, `model_ready_ms`
(process start to model ready), `launch_to_first_frame_ms`, `launch_to_active_ms`, `hitch_ms` (a frame over 33 ms, tagged
with the screen; only with `MODES_LOG_DEBUG=1` or `MODES_CAPTURE=1`, plus a `frame_summary` record every 30 s).
`ios-summary.py` reports n/p50/p90/max for each.

**Sessions and crashes.** Each launch writes `session_start` (version, build, device model, OS, low-power, thermal, free disk,
`previous_clean`); backgrounding and termination write `session_end` (`kv.reason`). If the previous session's last record is
not a `session_end`, the new launch logs `previous_session_ended_unexpectedly` with that session's last 25 lines in
`kv.breadcrumbs`. MetricKit payloads (crash, hang, CPU, disk-write diagnostics and daily metrics) arrive on the next launch and
are saved untouched to `Documents/logs/diagnostics/<stamp>-<kind>.json`. Crash logs (`.ips`) stay on the phone; `ios-pull.sh`
fetches and summarises them.

**Screenshots.** Only when launched with `MODES_CAPTURE=1`, `DevCapture` saves `Documents/shots/<stamp>.jpg` (about 1.5 s
cadence, only when the screen changed, newest 80 kept) and logs `screen` records (selected tab, popup state, presented sheet).
`DevCapture.snap("name")` takes a named capture on demand.

On the device: `Documents/logs/`, `Documents/logs/diagnostics/`, `Documents/shots/`, `Documents/events.jsonl`,
`Library/Application Support/listener-v2.plist`.

## Roadmap

The shipped model scores metadata directly, so songs outside the 10k catalogue are already scorable. The next step is a
**learned metadata-to-collaborative projection**, trained once (overnight or Colab) on a much larger crawl of playlists: song content
(artist, composer, label, language, year, title words, optionally an audio descriptor from Apple's sound classifier) →
a 128-number vector, so any new song is scored on the phone the moment the API returns it. On top, the personal learner
becomes a dense head in that space plus a sparse "wide" part for specific artists, a taste prior for the single
listener profile, forgetting for drifting taste, and model-based diversity. We evaluate offline first (cold-song
recall, per-language gaps) and then against real listening logs. Findings so far, including the hashed-metadata, Apple
sound-classifier and tiny-audio-model experiments: `docs/research/RESULTS.md` and `tools/recs/experiments/`.
**Deferred:** songs outside the on-device catalog have no feature vector, so they play but are not scored or learned
from; dynamic scoring needs this encoder, and the app says so rather than inventing features.

## Shared interactions

`SongListRow` owns the native list swipe actions, song menu and context menu across Home, Search, channel songs,
Library and Up Next. Settings → Swipe actions configures right/left actions and full-swipe behavior via UserDefaults;
player-cover gestures remain separate. `SongReference` keeps each action attached to its row’s source. Explicit
Tapping a row continues through the list it came from. Play next and Play last picks use `ListenerQueue` and survive
recommendation refreshes until consumed or the listener picks a different song. Non-current favorites update Library
without training an unheard song into the profile.

Search's empty state shows hot songs per selected language from `/api/trending` and the current charts. Search results
are sectioned into songs, albums, artists and playlists. A Settings button is the only account surface. No server-side
or catalog-pipeline changes.

## Working agreement

How we work on this (pushback welcome, release-first scope, device-only testing, subagent rules) is in `CLAUDE.md` at the
repo root.
