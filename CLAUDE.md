# CLAUDE.md

pnpm monorepo: `apps/api` (Hono on Vercel, region bom1), `apps/web` (Next.js), `apps/ios` (Modes, SwiftUI + `ModesCore`
package, XcodeGen). `research/` holds offline recommender experiments (`research/docs/RESULTS.md`). The code is the
documentation: no comments, no READMEs beyond the root one.

## Rules

- Push back with evidence, then do what the owner decides. Report what was verified and what was not; UI and audio are only
  checked on the phone or in a browser.
- Minimal features, rewrite instead of patching. No legacy code, fallbacks, migrations or shims; there is no prod data.
  Prefer a library over custom code. Delete before adding.
- Release scope only: no accounts, sync, widgets, CarPlay, social, or anything needing hosting for a growing catalogue.
- **Never boot the iOS Simulator or use GUI automation.** It crashes the Mac. Use `swift test`, the device-SDK build and the
  phone.
- PRs and deploys go to `nandan-varma/songs` only, never `sumitkolhe/jiosaavn-api`; pass `--repo`. Vercel: project
  `music-api` (root `apps/api`) serves `saavn-api.nandanvarma.com`, which the iOS app uses; project `songs` (root `apps/web`).
- Conventional lowercase commits, no AI attribution. Biome is the only linter/formatter.
- Subagents: give each explicit file ownership, verify with `pnpm check`, get a read-only review for playback code.
- Never run anything that can wait on stdin (e.g. a bare `wc -c $(…)`).

## Commands

```sh
pnpm check                              # swift test, lint, typecheck, tests, device build
tools/dev/ios-run.sh --capture --debug-log
tools/dev/ios-pull.sh --shots --state && python3 tools/dev/ios-summary.py latest
cd apps/ios && xcodegen generate        # after editing project.yml
```

## iOS invariants

- One hidden listener profile; no visible modes or knobs. For You and autoplay share one learner (sparse hashed metadata
  features + 64 dense dims from `ItemEncoder`); changing languages filters the slate without resetting taste.
- `ItemEncoder` is a learned embedding table (`Modes/Resources/table_fp16.bin`, `vocab.json`) trained offline by
  `research/recs/experiments/export_d.py`. Its tokenisation is `SongFeatures.tokens`, shared with the hasher and checked
  against `golden.json`; change one side and the other must be re-exported. Candidates from `/suggestions` get a capped rank
  prior. No decay/forgetting (it measurably hurt).
- Songs are live from the API; metadata is featurised on device. No bundled catalogue, no offline fallback.
- Events in `events.jsonl` carry `source` and `model` so skip rate can be compared per model (`tools/dev/ios-summary.py`).
- Pure logic lives in `ModesCore` (Foundation only). The app target holds AVFoundation, persistence and UI.
- `PlaybackLedger`: `generation` drops stale async work, `closed` accounts for a song exactly once, `started` learns only from
  songs that were heard. Signals: finish +1, skip `2·frac−1` (only if heard), "Suggest less" −1 (recorded even while paused).
- Learning, ranking and saving never block the main thread. Persistence is versioned with no migration; never overwrite an
  unreadable file.

## Gotchas

- LNPopupUI: blurred cover goes in `.background { }`, never a `ZStack` sibling; the XcodeGen dependency needs `embed: true`
  or the app dies at launch with dyld "Library not loaded" while the installer says "launched".
- `UIBackgroundModes` comes from `Modes/Info.plist`, not a build setting.
- Dev-signed release builds still allow `devicectl … copy from --domain-type appDataContainer` (how logs are pulled).
- JioSaavn is unofficial and geo-restricted: `reco.getreco` can be empty, no 15 s preview, lyrics are flaky.

## Next

Measure real listening (skip rate by `model`/`source`), retrain the encoder on a larger playlist crawl (English is barely
covered), and consider audio features only after the Essentia licence is settled. Offline results: `research/docs/RESULTS.md`.
