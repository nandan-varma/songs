#!/usr/bin/env python3
import argparse
import collections
import glob
import json
import math
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
KNOWN_METRICS = ["launch_to_first_frame_ms", "launch_to_active_ms"]
RETIRED_METRICS = {"catalog_load_ms"}
SLOW_MS = 1000

def pct(vals, p):
    s = sorted(vals)
    return s[min(len(s) - 1, max(0, math.ceil(p / 100 * len(s)) - 1))]

def read_jsonl(path):
    out = []
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if line.startswith("{"):
                    try:
                        out.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
    except OSError:
        pass
    return out

def hms(ts):
    return ts[11:23] if isinstance(ts, str) and len(ts) >= 23 else str(ts)

def fmt_line(r, width=150):
    kv = r.get("kv")
    extra = ""
    if kv:
        short = {k: v for k, v in kv.items() if k not in ("breadcrumbs", "stack")}
        if short:
            extra = " " + json.dumps(short, separators=(",", ":"))
    s = f"{hms(r.get('ts'))} {r.get('level', '?')[:1].upper()} {r.get('cat')} {r.get('msg')}{extra}"
    return s if len(s) <= width else s[: width - 1] + "…"

def parse_ts(ts):
    from datetime import datetime
    try:
        return datetime.strptime(ts, "%Y-%m-%dT%H:%M:%S.%fZ")
    except (TypeError, ValueError):
        return None

def sessions_section(recs, out):
    by = collections.OrderedDict()
    for r in recs:
        by.setdefault(r.get("session"), []).append(r)
    out.append(f"== sessions ({len(by)}) ==")
    unexpected = [r for r in recs if r.get("msg") == "previous_session_ended_unexpectedly"]
    bad = {r["kv"].get("previous_session") for r in unexpected if r.get("kv")}
    for sid, rs in list(by.items())[-6:]:
        start = next((r for r in rs if r.get("msg") == "session_start"), None)
        a, b = parse_ts(rs[0]["ts"]), parse_ts(rs[-1]["ts"])
        dur = f"{(b - a).total_seconds():.0f}s" if a and b else "?"
        kv = (start or {}).get("kv", {})
        ends = [r for r in rs if r.get("msg") == "session_end"]
        end = "clean(" + ends[-1].get("kv", {}).get("reason", "?") + ")" if ends and rs[-1].get("msg") == "session_end" else (
            "UNEXPECTED" if sid in bad else "running/last")
        out.append(f"{sid} {rs[0]['ts'][:19]} {dur:>6} {kv.get('app_version', '?')}({kv.get('build', '?')}) "
                   f"{kv.get('device', '?')} {kv.get('config', '')} thermal={kv.get('thermal', '?')} end={end}")
    for r in unexpected[-2:]:
        kv = r.get("kv", {})
        out.append(f"! session {kv.get('previous_session')} died unexpectedly; last breadcrumbs:")
        for line in (kv.get("breadcrumbs") or [])[-5:]:
            try:
                out.append("    " + fmt_line(json.loads(line), 130))
            except json.JSONDecodeError:
                out.append("    " + line[:130])

def problems_section(recs, out):
    wl = [r for r in recs if r.get("level") in ("warn", "error")]
    out.append(f"== warnings/errors ({len(wl)}) ==")
    if not wl:
        out.append("none")
        return
    cats = collections.defaultdict(lambda: collections.Counter())
    for r in wl:
        cats[r.get("cat")][r["level"]] += 1
    out.append("  ".join(f"{c}: {n['warn']}w/{n['error']}e" for c, n in sorted(cats.items(), key=lambda x: -sum(x[1].values()))[:8]))
    common = collections.Counter((r["level"], r["cat"], r["msg"][:90]) for r in wl).most_common(5)
    for (lvl, cat, msg), n in common:
        out.append(f"  {n:>3}x {lvl} [{cat}] {msg}")

def metrics_section(recs, out):
    ms = collections.defaultdict(list)
    for r in recs:
        if r.get("level") == "metric" and isinstance(r.get("kv", {}).get("value"), (int, float)):
            ms[r["msg"]].append(r["kv"]["value"])
    out.append("== metrics (n p50 p90 max) ==")
    names = KNOWN_METRICS + sorted(n for n in ms if n not in KNOWN_METRICS and n not in RETIRED_METRICS and n != "hitch_ms")
    shown = 0
    missing = []
    for n in names:
        v = ms.get(n)
        if v:
            out.append(f"{n:<26}{len(v):>5} {pct(v, 50):>9.1f} {pct(v, 90):>9.1f} {max(v):>9.1f}")
            shown += 1
        elif n in KNOWN_METRICS:
            missing.append(n)
    if missing:
        out.append("no samples: " + ", ".join(missing))
    h = ms.get("hitch_ms")
    summaries = [r["kv"] for r in recs if r.get("msg") == "frame_summary" and r.get("kv")]
    if h or summaries:
        fr = sum(s.get("frames", 0) for s in summaries)
        h33 = sum(s.get("hitches_33ms", 0) for s in summaries)
        h100 = sum(s.get("hitches_100ms", 0) for s in summaries)
        worst = max([s.get("worst_ms", 0) for s in summaries] + (h or [0]))
        rate = f"{100 * h33 / fr:.2f}%" if fr else "n/a"
        out.append(f"hitches: {len(h or [])} logged; frames={fr} >33ms={h33} ({rate}) >100ms={h100} worst={worst:.0f}ms")
        if h:
            screens = collections.Counter(r["kv"].get("tags", {}).get("screen", "?") for r in recs
                                          if r.get("msg") == "hitch_ms" and r.get("kv"))
            out.append("  by screen: " + ", ".join(f"{s or '?'}={n}" for s, n in screens.most_common(4)))
    slow = sorted(((r["kv"]["value"], r["msg"], r["ts"]) for r in recs
                   if r.get("level") == "metric" and r.get("msg") != "hitch_ms" and (r.get("kv") or {}).get("unit") == "ms"
                   and isinstance(r["kv"].get("value"), (int, float)) and r["kv"]["value"] >= SLOW_MS), reverse=True)[:5]
    if slow:
        out.append(f"slow spans (>= {SLOW_MS} ms): " + "; ".join(f"{n} {v:.0f}ms @{hms(t)}" for v, n, t in slow))

def playback_section(recs, out):
    fails = [r for r in recs if r.get("level") in ("warn", "error")
             and (r.get("cat") in ("player", "playback", "resolve", "audio") or "fail" in r.get("msg", "").lower())]
    out.append(f"== playback failures ({len(fails)}) ==")
    for r in fails[-4:]:
        out.append("  " + fmt_line(r, 140))

def context_section(recs, out):
    errs = [i for i, r in enumerate(recs) if r.get("level") == "error"]
    if not errs:
        return
    i = errs[-1]
    out.append(f"== 30 lines before the last error (seq {recs[i].get('seq')}, session {recs[i].get('session')}) ==")
    for r in recs[max(0, i - 30): i + 1]:
        out.append(fmt_line(r))

def events_section(path, out):
    ev = read_jsonl(path)
    out.append(f"== listening events ({len(ev)}) ==")
    if not ev:
        out.append("none")
        return
    types = collections.Counter(e.get("type") for e in ev)
    out.append("types: " + ", ".join(f"{t}={n}" for t, n in types.most_common(12)))
    outcomes = []
    for e in sorted(ev, key=lambda e: e.get("t") or ""):
        t = e.get("type")
        if t == "completed":
            outcomes.append(False)
        elif t in ("skipped", "skipped_unheard") or (t == "switched_away" and (e.get("frac") or 0) < 0.5):
            outcomes.append(True)
    first, later = outcomes[:10], outcomes[10:]
    f = lambda xs: f"{100 * sum(xs) / len(xs):.0f}% of {len(xs)}" if xs else "n/a"
    out.append(f"completed={outcomes.count(False)} skipped={outcomes.count(True)} skip-rate first10={f(first)} later={f(later)}"
               f" picked={types.get('picked', 0)} suggest_less={types.get('suggest_less', 0)}"
               f" unfavorite={types.get('unfavorite', 0)} profile_reset={types.get('profile_reset', 0)}")

def main():
    ap = argparse.ArgumentParser(description="Summarise a pull folder from ios-pull.sh.")
    ap.add_argument("dir", nargs="?", default="latest", help="pull folder, or 'latest'")
    a = ap.parse_args()
    d = os.path.join(ROOT, "dev-out", "pull", "latest") if a.dir == "latest" else a.dir
    if not os.path.isdir(d):
        sys.exit(f"error: {d} is not a directory (run tools/dev/ios-pull.sh first)")
    d = os.path.realpath(d)
    out = [f"summary of {d}"]
    files = sorted(glob.glob(os.path.join(d, "logs", "modes-*.jsonl")))
    recs = [r for f in files for r in read_jsonl(f)]
    recs.sort(key=lambda r: (r.get("ts", ""), r.get("seq", 0)))
    if recs:
        out.append(f"logs: {len(recs)} records in {len(files)} files, {recs[0]['ts'][:19]} .. {recs[-1]['ts'][:19]}")
        sessions_section(recs, out)
        problems_section(recs, out)
        metrics_section(recs, out)
        playback_section(recs, out)
    else:
        out.append("logs: none (the installed build predates logging v2, or the app has not run since install)")
    diag = sorted(glob.glob(os.path.join(d, "logs", "diagnostics", "*.json")))
    if diag:
        out.append("metrickit: " + ", ".join(os.path.basename(x) for x in diag[-4:]))
    crashes = sorted(glob.glob(os.path.join(d, "crashes", "*.txt")))
    if crashes:
        out.append(f"== crash logs ({len(crashes)}), newest: {os.path.basename(crashes[-1])} ==")
        for line in open(crashes[-1]).read().splitlines()[:8]:
            out.append("  " + line[:150])
    events_section(os.path.join(d, "events.jsonl"), out)
    if recs:
        context_section(recs, out)
    print("\n".join(out))

if __name__ == "__main__":
    main()
