#!/usr/bin/env python3
"""Turn an iOS .ips crash report (JSON header line + JSON body) into a short readable summary."""
import argparse
import json
import sys


def load(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        text = f.read()
    head, _, rest = text.partition("\n")
    header = json.loads(head)
    body = json.loads(rest) if rest.strip() else {}
    return header, body


def frame_text(fr, images):
    idx = fr.get("imageIndex")
    img = images[idx] if isinstance(idx, int) and 0 <= idx < len(images) else {}
    name = img.get("name") or "?"
    sym = fr.get("symbol")
    if sym:
        loc = fr.get("symbolLocation")
        return f"{name}  {sym}" + (f" + {loc}" if loc is not None else "")
    return f"{name}  +{fr.get('imageOffset', '?')}"


def summarize(header, body, top=12):
    out = []
    add = out.append
    images = body.get("usedImages", [])
    add(f"app:        {body.get('procName') or header.get('app_name')}  "
        f"{header.get('app_version', '?')} ({header.get('build_version', '?')})  {header.get('bundleID', '')}")
    add(f"time:       {body.get('captureTime') or header.get('timestamp')}   (launched {body.get('procLaunch', '?')})")
    add(f"os/device:  {(body.get('osVersion') or {}).get('train', header.get('os_version', '?'))}  {body.get('modelCode', '')}")
    exc = body.get("exception", {})
    add(f"exception:  {exc.get('type', '?')} {exc.get('signal', '')}  codes={exc.get('codes', '')}  subtype={exc.get('subtype', '')}")
    term = body.get("termination", {})
    if term:
        reasons = term.get("reasons") or ([term["details"]] if term.get("details") else [])
        add(f"terminated: namespace={term.get('namespace')} code={term.get('code')} indicator={term.get('indicator', '')}")
        for r in reasons:
            add(f"  reason:   {r}")
    if body.get("asi"):  # application-specific info, where dyld puts "Library missing" messages
        for lib, msgs in body["asi"].items():
            for m in (msgs if isinstance(msgs, list) else [msgs]):
                add(f"  asi[{lib}]: {m}")
    if body.get("vmRegionInfo"):
        add(f"vm region:  {body['vmRegionInfo'].splitlines()[0]}")
    threads = body.get("threads", [])
    ft = body.get("faultingThread")
    crashed = threads[ft] if isinstance(ft, int) and ft < len(threads) else next((t for t in threads if t.get("triggered")), None)
    if crashed:
        add(f"crashed thread: {crashed.get('name') or crashed.get('queue') or ft} (index {ft})")
        for i, fr in enumerate(crashed.get("frames", [])[:top]):
            add(f"  {i:2d} {frame_text(fr, images)}")
    else:
        add("crashed thread: none recorded")
    last = body.get("lastExceptionBacktrace")
    if last:
        add("last exception backtrace:")
        for i, fr in enumerate(last[:top]):
            add(f"  {i:2d} {frame_text(fr, images)}")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("ips", help="path to a .ips file")
    ap.add_argument("--top", type=int, default=12, help="frames to show (default 12)")
    a = ap.parse_args()
    try:
        h, b = load(a.ips)
    except (OSError, json.JSONDecodeError) as e:
        sys.exit(f"error: cannot read {a.ips}: {e}")
    print(summarize(h, b, a.top))


if __name__ == "__main__":
    main()
