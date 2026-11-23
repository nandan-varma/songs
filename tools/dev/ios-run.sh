#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

usage() {
  cat <<'USAGE'
Usage: tools/dev/ios-run.sh [--capture] [--debug-log] [--no-build] [--dry-run]

  --capture     launch with MODES_CAPTURE=1 (DevCapture screenshots to Documents/shots, hitch monitor on)
  --debug-log   launch with MODES_LOG_DEBUG=1 (debug-level records, hitch monitor on)
  --no-build    skip the build; reinstall whatever is in dev-out/derived
  --dry-run     print the commands that would run and exit

Always sets MODES_LOG_STDOUT=1 so the console shows every log record. The console is teed to
dev-out/runs/<timestamp>.log. When the app exits (or on Ctrl-C) a short summary is printed.
Env: DEVICE=<udid|name> overrides auto-detection.
USAGE
}

CAPTURE=0; DEBUG=0; BUILD=1; DRY=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --capture) CAPTURE=1 ;;
    --debug-log) DEBUG=1 ;;
    --no-build) BUILD=0 ;;
    --dry-run) DRY=1 ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; die "unknown option: $1" ;;
  esac
  shift
done

DERIVED="$OUT_DIR/derived"
APP="$DERIVED/Build/Products/Release-iphoneos/Modes.app"
RUN_LOG="$OUT_DIR/runs/$(date +%Y%m%d-%H%M%S).log"
if (( DRY )); then UDID="${DEVICE:-<auto-detected udid>}"; else UDID="$(detect_device)"; fi

export DEVICECTL_CHILD_MODES_LOG_STDOUT=1
(( CAPTURE )) && export DEVICECTL_CHILD_MODES_CAPTURE=1
(( DEBUG )) && export DEVICECTL_CHILD_MODES_LOG_DEBUG=1

BUILD_CMD=(helpers xcode build "$IOS_DIR" --opts "{\"scheme\":\"Modes\",\"destination\":\"device\",\"derivedData\":\"$DERIVED\",\"args\":[\"-configuration\",\"Release\"]}")
INSTALL_CMD=(xcrun devicectl device install app --device "$UDID" "$APP")
LAUNCH_CMD=(xcrun devicectl device process launch --device "$UDID" --terminate-existing --console "$BUNDLE_ID")

if (( DRY )); then
  echo "# env: DEVICECTL_CHILD_MODES_LOG_STDOUT=1$( ((CAPTURE)) && echo ' DEVICECTL_CHILD_MODES_CAPTURE=1')$( ((DEBUG)) && echo ' DEVICECTL_CHILD_MODES_LOG_DEBUG=1')"
  (( BUILD )) && printf '%q ' "${BUILD_CMD[@]}" && echo
  printf '%q ' "${INSTALL_CMD[@]}"; echo
  printf '%q ' "${LAUNCH_CMD[@]}"; echo "2>&1 | tee $RUN_LOG"
  exit 0
fi

mkdir -p "$OUT_DIR/runs"
if (( BUILD )); then "${BUILD_CMD[@]}" || die "build failed"; fi
[[ -d "$APP" ]] || die "no built app at $APP (run without --no-build)"
"${INSTALL_CMD[@]}" >/dev/null || die "install failed (is the phone unlocked and trusted?)"

summary() {
  trap - INT TERM EXIT
  echo
  echo "== run summary ($RUN_LOG) =="
  local total errs warns
  total=$(wc -l < "$RUN_LOG" | tr -d ' ')
  errs=$(grep -c ' ERROR ' "$RUN_LOG" || true)
  warns=$(grep -c ' WARN ' "$RUN_LOG" || true)
  echo "$total lines, $errs errors, $warns warnings"
  grep -E ' (ERROR|WARN) ' "$RUN_LOG" | tail -5 || true
  grep -E 'session_end|unexpected' "$RUN_LOG" | tail -2 || true
  echo "pull the full logs with: tools/dev/ios-pull.sh && python3 tools/dev/ios-summary.py latest"
}
trap summary EXIT
trap 'exit 130' INT TERM
echo "launching on $UDID (Ctrl-C to detach)..."
"${LAUNCH_CMD[@]}" 2>&1 | tee "$RUN_LOG" || true
