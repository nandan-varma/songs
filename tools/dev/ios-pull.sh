#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

usage() {
  cat <<'USAGE'
Usage: tools/dev/ios-pull.sh [--shots] [--state] [--crashes N]

Pulls into dev-out/pull/<timestamp>/ (and repoints dev-out/pull/latest):
  logs/            Documents/logs/** (JSON-lines logs + MetricKit diagnostics)
  events.jsonl     Documents/events.jsonl (listening events)
  shots/           Documents/shots/**           only with --shots
  listener-v2.plist  Library/Application Support/listener-v2.plist   only with --state
  crashes/         newest N (default 3) Modes crash logs (.ips) plus a readable .txt summary of each

Env: DEVICE=<udid|name> overrides auto-detection of the paired iPhone.
Missing files (older builds have no Documents/logs) are skipped with a note.
USAGE
}

SHOTS=0; STATE=0; NCRASH=3
while [[ $# -gt 0 ]]; do
  case "$1" in
    --shots) SHOTS=1 ;;
    --state) STATE=1 ;;
    --crashes) shift; NCRASH="${1:?--crashes needs a number}" ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; die "unknown option: $1" ;;
  esac
  shift
done

UDID="$(detect_device)"
STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="$OUT_DIR/pull/$STAMP"
mkdir -p "$DEST"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
echo "device $UDID -> $DEST"

xcrun devicectl device info files --device "$UDID" --domain-type appDataContainer --domain-identifier "$BUNDLE_ID" \
  --json-output "$TMP/files.json" >/dev/null 2>&1 || die "cannot list the app container (is the app installed? is the phone unlocked?)"

python3 - "$TMP/files.json" "$SHOTS" "$STATE" > "$TMP/wanted.txt" <<'PY'
import json, sys
files, shots, state = json.load(open(sys.argv[1]))["result"]["files"], sys.argv[2] == "1", sys.argv[3] == "1"
for f in files:
    p = f["relativePath"]
    if f["resources"].get("isDirectory"): continue
    if p.startswith("Documents/logs/") or p == "Documents/events.jsonl" \
       or (shots and p.startswith("Documents/shots/")) \
       or (state and p == "Library/Application Support/listener-v2.plist"):
        print(p)
PY

copy_one() {
  local rel="$1" out="$DEST/$2"
  mkdir -p "$(dirname "$out")"
  xcrun devicectl device copy from --device "$UDID" --domain-type appDataContainer --domain-identifier "$BUNDLE_ID" \
    --source "$rel" --destination "$out" >/dev/null 2>&1 || echo "  failed: $rel" >&2
}

N=0
while IFS= read -r rel; do
  [[ -n "$rel" ]] || continue
  case "$rel" in
    Documents/logs/*) local_rel="logs/${rel#Documents/logs/}" ;;
    Documents/shots/*) local_rel="shots/${rel#Documents/shots/}" ;;
    Documents/events.jsonl) local_rel="events.jsonl" ;;
    *listener-v2.plist) local_rel="listener-v2.plist" ;;
    *) continue ;;
  esac
  copy_one "$rel" "$local_rel" &
  N=$((N+1))
  (( N % 4 == 0 )) && wait
done < "$TMP/wanted.txt"
wait
[[ -d "$DEST/logs" ]] || echo "  note: no Documents/logs on the phone yet (build predates logging v2)"
[[ -f "$DEST/events.jsonl" ]] || echo "  note: no events.jsonl"

xcrun devicectl device info files --device "$UDID" --domain-type systemCrashLogs --json-output "$TMP/crash.json" >/dev/null 2>&1 \
  || echo "  note: could not list crash logs" >&2
if [[ -f "$TMP/crash.json" ]]; then
  python3 - "$TMP/crash.json" "$NCRASH" > "$TMP/crashes.txt" <<'PY'
import json, sys
names = [f["relativePath"] for f in json.load(open(sys.argv[1]))["result"]["files"]
         if f["relativePath"].startswith("Modes-") and f["relativePath"].endswith(".ips")]
for n in sorted(names)[-int(sys.argv[2]):]: print(n)
PY
  mkdir -p "$DEST/crashes"
  while IFS= read -r name; do
    [[ -n "$name" ]] || continue
    xcrun devicectl device copy from --device "$UDID" --domain-type systemCrashLogs --source "$name" \
      --destination "$DEST/crashes/$name" >/dev/null 2>&1 || { echo "  failed: $name" >&2; continue; }
    python3 "$(dirname "${BASH_SOURCE[0]}")/ips2txt.py" "$DEST/crashes/$name" > "$DEST/crashes/${name%.ips}.txt" \
      || echo "  could not summarise $name" >&2
  done < "$TMP/crashes.txt"
fi

ln -sfn "$DEST" "$OUT_DIR/pull/latest"
echo "pulled:"
(cd "$DEST" && find . -type f | sed 's|^\./||' | sort | awk -F/ '{d=($2==""?"(top)":$1); c[d]++} END{for(k in c) printf "  %-10s %d files\n", k, c[k]}')
echo "latest -> $DEST"
echo "next: python3 tools/dev/ios-summary.py latest"
