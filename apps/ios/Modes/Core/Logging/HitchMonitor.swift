import Foundation
import QuartzCore
import UIKit

@MainActor
final class HitchMonitor: NSObject {
    static let shared = HitchMonitor()
    static var isEnabled: Bool {
        let env = ProcessInfo.processInfo.environment
        return env["MODES_LOG_DEBUG"] == "1" || env["MODES_CAPTURE"] == "1"
    }

    private var link: CADisplayLink?
    private var lastTimestamp: CFTimeInterval = 0
    private var frames = 0, over33 = 0, over100 = 0
    private var worstMs = 0.0
    private var windowStart: CFTimeInterval = 0

    func startIfEnabled() {
        guard Self.isEnabled, link == nil else { return }
        let l = CADisplayLink(target: self, selector: #selector(tick(_:)))
        l.add(to: .main, forMode: .common)
        link = l
    }

    func reset() { lastTimestamp = 0 }

    @objc private func tick(_ l: CADisplayLink) {
        defer { lastTimestamp = l.timestamp }
        if windowStart == 0 { windowStart = l.timestamp }
        guard lastTimestamp > 0 else { return }
        let ms = (l.timestamp - lastTimestamp) * 1000
        guard ms < 2000 else { return }
        frames += 1
        if ms > 33 {
            over33 += 1
            if ms > 100 { over100 += 1 }
            worstMs = max(worstMs, ms)
            AppLog.metric("hitch_ms", ms.rounded(), unit: "ms", tags: ["screen": ScreenHint.current().text])
        }
        if l.timestamp - windowStart >= 30 {
            AppLog.info("perf", "frame_summary", ["frames": frames, "hitches_33ms": over33, "hitches_100ms": over100,
                                                  "worst_ms": worstMs.rounded()])
            frames = 0; over33 = 0; over100 = 0; worstMs = 0; windowStart = l.timestamp
        }
    }
}
