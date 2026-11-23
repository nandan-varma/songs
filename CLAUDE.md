# CLAUDE.md

Monorepo (pnpm workspaces) of a JioSaavn music stack: `apps/api` (Hono), `apps/web` (Next.js), `apps/ios` (**Modes**, iOS
app with one hidden on-device listener profile behind For You). Architecture and dev loop for iOS: `apps/ios/README.md`.
Measured findings behind the recommender design: `research/docs/RESULTS.md`.

## How we work

- **Push back.** The owner prefers a reasoned disagreement to silent agreement. If a decision looks wrong, say so in a few
  lines with the evidence, then do what they decide. Don't pad, don't flatter.
- **Report honestly.** Say what you verified (tests, device build, device logs) and what you could not. "Compiles" is not
  "works"; UI and audio are only truly checked on the phone or in a browser.
- **Minimal, rewrite don't patch.** Minimal feature set. No legacy code, fallbacks, migrations or compat shims; there is no
  production data. Prefer a well-chosen library over custom code. Delete before adding.
- **Release first.** No nice-to-haves (accounts, sync, widgets, lyrics, CarPlay, social) until asked. Don't build anything
  that needs hosting or upkeep for an ever-growing catalogue.
- **Design for the future, ship the simple thing.** The next big step is a learned song encoder (Roadmap). Don't over-build
  for it, don't paint it into a corner.
- **Subagents are welcome** for parallel work. Give each an explicit file-ownership list, forbid installing on the phone and
  any simulator use, and verify their work yourself (`pnpm check`) before committing. Get an independent read-only review
  for risky code (playback).

## Hard rules

- **Never boot the iOS Simulator or use GUI/UI automation of the Mac.** It crashes the owner's Mac. Test with `swift test`, a
  device-SDK build, and the physical iPhone. After accidental use: `xcrun simctl shutdown all`.
- **PRs and deploys go to `nandan-varma/songs` only**, never the upstream (`sumitkolhe/jiosaavn-api`). Always pass `--repo`.
  The API is the Vercel project `music-api` (root `apps/api`) aliased to `https://saavn-api.nandanvarma.com`; the iOS app
  uses that URL.
- Commits: conventional, lowercase subject, no AI attribution. Linting and formatting: Biome only (repo root).
- Don't run a bare `wc -c $(…)` or anything that can wait on stdin; it hangs a session silently.

## Commands

```sh
pnpm check                                           # swift test + lint + typecheck + tests + device build
pnpm dev:api | pnpm dev:web                          # local servers
cd apps/ios/Packages/ModesCore && swift test         # learner / recommender / logging logic (no simulator)
tools/dev/ios-pull.sh --shots --state && python3 tools/dev/ios-summary.py latest   # logs, crashes, screenshots from the phone
tools/dev/ios-run.sh --capture --debug-log           # build, install, run with console (restarts the app on the phone)
cd apps/ios && xcodegen generate                     # after editing apps/ios/project.yml
```

## iOS invariants (don't break without a measured reason)

- **One hidden listener profile.** No user-visible modes or tuning knobs. For You and autoplay rank from the same sparse
  hashed model; changing languages filters the slate without resetting taste.
- **Songs are live.** Metadata is hashed on device. There is no bundled catalogue and no offline fallback; never require a
  song to be in any fixed list to be scored or learned from.
- **Pure logic lives in `ModesCore`** (Foundation only, tested on the Mac); the app target holds AVFoundation, persistence, UI.
- **Playback state machine** (`PlaybackLedger`): `generation` (stale async work is dropped), `closed` (a song is accounted
  for exactly once), `started` (learn only from songs that were heard). Signals: finish +1, skip `2·frac−1` (only if heard),
  "Suggest less" −1. An explicit exclusion is recorded even while personalization is paused.
- Learning, ranking and saving never block the main thread; a tap flips state immediately and enqueues the rest.
- Persistence is versioned with no migration from old state. Never overwrite a file it could not read.

## Gotchas

- **LNPopupUI:** put a blurred cover in `.background { }`, never as a `ZStack` sibling of content. The XcodeGen dependency
  needs `embed: true`, or the app dies at launch with dyld "Library not loaded" while the install helper still says "launched".
- `UIBackgroundModes` comes from `Modes/Info.plist`, not a build setting.
- Release builds signed for development still allow `devicectl … copy from --domain-type appDataContainer`; that is how logs
  and screenshots are pulled.
- JioSaavn is unofficial: `reco.getreco` can be empty, the wrapper doesn't expose the 15 s preview, lyrics are flaky.
  JioSaavn geo-restricts, hence region `bom1`.

## Roadmap (next, not now)

Train a **learned metadata-to-collaborative projection** once (Colab or overnight): content features (artist, composer,
label, language, year, title words, optional audio descriptor) → a 128-d vector trained on playlist co-occurrence, so any new
song is scored on-device instantly. Personal learner on top: dense head in embedding space plus a sparse "wide" part for
specific artists, a taste prior for the one profile, forgetting, model-based diversity. Evaluate offline first (cold-split
recall, per-language gaps), then against real listening logs. Experiments: `research/`.
