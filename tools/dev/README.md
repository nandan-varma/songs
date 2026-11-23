# tools/dev

Developer loop for the iOS app without a simulator. Output goes to `dev-out/` (git-ignored). The phone is auto-detected
(`DEVICE=<udid|name>` overrides). Details of the log format: `ios/Modes/README.md`, section "Dev loop".

| Tool | Purpose |
| --- | --- |
| `ios-pull.sh [--shots] [--state] [--crashes N]` | Read-only pull of logs, MetricKit diagnostics, events, optional screenshots/state and the newest crash logs (with a readable `.txt` each) into `dev-out/pull/<ts>/` + `latest` |
| `ios-summary.py [dir\|latest]` | One-screen analysis of a pull: sessions, unexpected endings, errors, metric percentiles, hitches, playback failures, listening stats |
| `ios-run.sh [--capture] [--debug-log] [--no-build] [--dry-run]` | Build Release, install, launch with the console attached (RESTARTS the app on the phone) |
| `check.sh` | swift test + vitest + eslint + device-SDK build, in parallel |
| `ips2txt.py file.ips` | Crash log to text (used by `ios-pull.sh`) |

The three you will use most:

```sh
tools/dev/ios-pull.sh && python3 tools/dev/ios-summary.py latest   # after any bug report or crash
tools/dev/ios-run.sh --capture                                      # live console + screenshots in Documents/shots
tools/dev/check.sh                                                  # before handing work back
```
