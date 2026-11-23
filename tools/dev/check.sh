#!/usr/bin/env bash
# Run every check in parallel and print one line per check, plus the output of failing ones.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

usage() {
  cat <<'USAGE'
Usage: tools/dev/check.sh

Runs in parallel: swift test (ModesCore), bunx vitest run (API), bunx eslint src, and the device-SDK app build
(into dev-out/derived). Prints PASS/FAIL per check and the output of failures.
Exit status is non-zero if anything failed.
USAGE
}
case "${1:-}" in -h|--help) usage; exit 0 ;; "") ;; *) usage >&2; die "unknown option: $1" ;; esac

START=$SECONDS
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
NAMES=(swift-test vitest eslint ios-build)
CMDS=(
  "cd '$IOS_DIR/Packages/ModesCore' && swift test"
  "cd '$DEV_ROOT' && bunx vitest run"
  "cd '$DEV_ROOT' && bunx eslint src"
  "helpers xcode build '$IOS_DIR' --opts '{\"scheme\":\"Modes\",\"destination\":\"device\",\"derivedData\":\"$OUT_DIR/derived\"}'"
)
for i in "${!NAMES[@]}"; do
  ( s=$SECONDS; set +e; bash -c "${CMDS[$i]}" > "$TMP/${NAMES[$i]}.out" 2>&1; echo "$? $((SECONDS - s))" > "$TMP/${NAMES[$i]}.rc" ) &
done
wait

FAIL=0
for n in "${NAMES[@]}"; do
  read -r rc secs < "$TMP/$n.rc"
  if [[ "$rc" == 0 ]]; then printf 'PASS  %-12s %4ss\n' "$n" "$secs"
  else printf 'FAIL  %-12s %4ss (exit %s)\n' "$n" "$secs" "$rc"; FAIL=1; fi
done
for n in "${NAMES[@]}"; do
  read -r rc _ < "$TMP/$n.rc"
  if [[ "$rc" != 0 ]]; then echo; echo "---- $n ----"; tail -40 "$TMP/$n.out"; fi
done
echo; echo "total: $((SECONDS - START))s"
exit $FAIL
