#!/usr/bin/env python3
import argparse
import collections
from datetime import datetime
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

CLOSED = ("completed", "skipped", "skipped_unheard", "switched_away")
ALL = ("*", "*")


def to_dt(ts):
    try:
        return datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
    except ValueError:
        return None


def session_starts(recs):
    first = {}
    for r in recs:
        t, sid = to_dt(r.get("ts")), r.get("session")
        if t and sid and (sid not in first or t < first[sid]):
            first[sid] = t
    return sorted((t, sid) for sid, t in first.items())


def session_at(t, starts):
    sid = None
    for start, s in starts:
        if start > t:
            break
        sid = s
    return sid


def is_skip(e):
    t = e.get("type")
    return t in ("skipped", "skipped_unheard") or (t == "switched_away" and (e.get("frac") or 0) < 0.5)


def pc(n, d):
    return f"{100 * n / d:.0f}%" if d else "n/a"


def events_section(path, out, recs):
    ev = read_jsonl(path)
    out.append(f"== listening events ({len(ev)}) ==")
    if not ev:
        out.append("none")
    else:
        types = collections.Counter(e.get("type") for e in ev)
        out.append("types: " + ", ".join(f"{t}={n}" for t, n in types.most_common(12)))
        starts = session_starts(recs)
        stats = collections.defaultdict(collections.Counter)
        seen = collections.Counter()
        for e in sorted((e for e in ev if e.get("type") in CLOSED), key=lambda e: e.get("t") or ""):
            t = to_dt(e.get("t"))
            sid = session_at(t, starts) if (t and starts) else None
            first3 = False
            if sid is not None:
                seen[sid] += 1
                first3 = seen[sid] <= 3
            skip = is_skip(e)
            for key in ((e.get("model") or "-", e.get("source") or "-"), ALL):
                s = stats[key]
                s["plays"] += 1
                s["done"] += e.get("type") == "completed"
                s["skip"] += skip
                if first3:
                    s["f3"] += 1
                    s["f3skip"] += skip
        out.append(f"{'model':<6}{'source':<10}{'plays':>6}{'done':>6}{'skip':>6}{'1st3skip':>12}")
        for key in sorted(stats, key=lambda k: (k == ALL, -stats[k]["plays"])):
            s = stats[key]
            model, source = ("all", "") if key == ALL else key
            f3 = f"{pc(s['f3skip'], s['f3'])}/{s['f3']}" if s["f3"] else "n/a"
            out.append(f"{model:<6}{source:<10}{s['plays']:>6}{pc(s['done'], s['plays']):>6}"
                       f"{pc(s['skip'], s['plays']):>6}{f3:>12}")
        out.append(f"picked={types.get('picked', 0)} suggest_less={types.get('suggest_less', 0)}"
                   f" unfavorite={types.get('unfavorite', 0)} profile_reset={types.get('profile_reset', 0)}")
    slates = [r["kv"] for r in recs if r.get("cat") == "ranking" and r.get("msg") == "slate" and isinstance(r.get("kv"), dict)]
    mixes = [s.get("trending", 0) / (s.get("trending", 0) + s.get("similar", 0))
             for s in slates if s.get("trending", 0) + s.get("similar", 0)]
    if mixes:
        tr = sum(mixes) / len(mixes)
        cands = sum(s.get("candidates", 0) for s in slates) / len(slates)
        out.append(f"slate mix: {len(mixes)} slates, mean trending {100 * tr:.0f}%, similar {100 * (1 - tr):.0f}%, "
                   f"mean candidates {cands:.0f}")


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
    events_section(os.path.join(d, "events.jsonl"), out, recs)
    if recs:
        context_section(recs, out)
    print("\n".join(out))

if __name__ == "__main__":
    main()
