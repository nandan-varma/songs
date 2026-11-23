# Shared helpers for tools/dev scripts (sourced, not executed).
BUNDLE_ID="com.nandanvarma.modes"
DEV_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IOS_DIR="$DEV_ROOT/ios/Modes"
OUT_DIR="$DEV_ROOT/dev-out"

die() { echo "error: $*" >&2; exit 1; }

# Prints the UDID of the paired, connected physical iPhone; DEVICE=<udid|name> overrides.
detect_device() {
  if [[ -n "${DEVICE:-}" ]]; then echo "$DEVICE"; return; fi
  command -v xcrun >/dev/null || die "xcrun not found (install Xcode command line tools)"
  local tmp; tmp="$(mktemp)"
  xcrun devicectl list devices --json-output "$tmp" >/dev/null 2>&1 || { rm -f "$tmp"; die "devicectl list devices failed"; }
  local udid
  udid="$(python3 - "$tmp" <<'PY'
import json, sys
devs = json.load(open(sys.argv[1]))["result"]["devices"]
ok = [d for d in devs if d["hardwareProperties"].get("reality") == "physical"
      and d["hardwareProperties"].get("deviceType") == "iPhone"
      and d["connectionProperties"].get("tunnelState") in ("connected", "connecting")]
print(ok[0]["hardwareProperties"]["udid"] if ok else "")
PY
)"
  rm -f "$tmp"
  [[ -n "$udid" ]] || die "no connected physical iPhone found (unlock it, plug it in, or set DEVICE=<udid>)"
  echo "$udid"
}
