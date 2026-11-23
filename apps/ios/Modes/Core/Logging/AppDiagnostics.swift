import Foundation
import MetricKit
import UIKit
import ModesCore

/// Session records, lifecycle logging, system-condition changes and MetricKit delivery. `start()` is called once from
/// `ModesApp.init`; everything else is observers.
@MainActor
enum AppDiagnostics {
    private static var started = false
    private static var firstContentLogged = false
    private static let metricKit = MetricKitReceiver()
    private static var observers: [any NSObjectProtocol] = []

    static func start() {
        guard !started else { return }
        started = true
        AppLog.installCrashHooks()
        AppLog.writer.logSessionStart(environment())
        MXMetricManager.shared.add(metricKit)
        observe()
        DevCapture.startIfEnabled()
        HitchMonitor.shared.startIfEnabled()
    }

    /// Called from the first view's `onAppear`: the nearest cheap proxy for "first frame is on screen".
    static func firstContentAppeared() {
        guard !firstContentLogged else { return }
        firstContentLogged = true
        if let ms = msSinceProcessStart() { AppLog.metric("launch_to_first_frame_ms", ms, unit: "ms") }
    }

    // MARK: Session record

    private static func environment() -> [String: any Sendable] {
        let info = Bundle.main.infoDictionary
        let pi = ProcessInfo.processInfo
        var kv: [String: any Sendable] = [
            "app_version": info?["CFBundleShortVersionString"] as? String ?? "?",
            "build": info?["CFBundleVersion"] as? String ?? "?",
            "device": machineIdentifier(),
            "os": pi.operatingSystemVersionString,
            "low_power": pi.isLowPowerModeEnabled,
            "thermal": thermalName(pi.thermalState),
        ]
        if let free = try? URL(fileURLWithPath: NSHomeDirectory()).resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey])
            .volumeAvailableCapacityForImportantUsage {
            kv["free_disk_mb"] = Int(free / 1_048_576)
        }
        #if DEBUG
        kv["config"] = "debug"
        #else
        kv["config"] = "release"
        #endif
        kv["capture"] = pi.environment["MODES_CAPTURE"] == "1"
        return kv
    }

    private static func machineIdentifier() -> String {
        var u = utsname(); uname(&u)
        return withUnsafeBytes(of: &u.machine) { raw in
            String(decoding: raw.prefix { $0 != 0 }, as: UTF8.self)
        }
    }

    private static func thermalName(_ s: ProcessInfo.ThermalState) -> String {
        switch s { case .nominal: "nominal"; case .fair: "fair"; case .serious: "serious"; case .critical: "critical"; @unknown default: "unknown" }
    }

    private static func msSinceProcessStart() -> Double? {
        var info = kinfo_proc()
        var size = MemoryLayout<kinfo_proc>.stride
        var mib: [Int32] = [CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()]
        guard sysctl(&mib, 4, &info, &size, nil, 0) == 0 else { return nil }
        let t = info.kp_proc.p_un.__p_starttime
        let started = Double(t.tv_sec) + Double(t.tv_usec) / 1e6
        return ((Date().timeIntervalSince1970 - started) * 1000).rounded()
    }

    // MARK: Observers

    private static func observe() {
        let nc = NotificationCenter.default
        func on(_ name: Notification.Name, _ body: @escaping @MainActor () -> Void) {
            observers.append(nc.addObserver(forName: name, object: nil, queue: .main) { _ in MainActor.assumeIsolated { body() } })
        }
        on(UIApplication.didBecomeActiveNotification) {
            HitchMonitor.shared.reset()
            AppLog.info("lifecycle", "active")
            if let ms = msSinceProcessStart(), !activeLogged { activeLogged = true; AppLog.metric("launch_to_active_ms", ms, unit: "ms") }
        }
        on(UIApplication.willResignActiveNotification) { AppLog.info("lifecycle", "inactive") }
        on(UIApplication.willEnterForegroundNotification) {
            AppLog.info("lifecycle", "foreground")
            AppLog.info("session", "session_resume", ["thermal": thermalName(ProcessInfo.processInfo.thermalState),
                                                      "low_power": ProcessInfo.processInfo.isLowPowerModeEnabled])
        }
        on(UIApplication.didEnterBackgroundNotification) {
            AppLog.info("lifecycle", "background")
            // Ask for a moment of background time so the flush finishes before the process is suspended.
            let id = UIApplication.shared.beginBackgroundTask(withName: "log-flush")
            AppLog.writer.logSessionEnd(["reason": "background"]) {
                DispatchQueue.main.async { UIApplication.shared.endBackgroundTask(id) }
            }
        }
        on(UIApplication.willTerminateNotification) {
            AppLog.writer.logSessionEndAndWait(["reason": "terminate"])
        }
        on(UIApplication.didReceiveMemoryWarningNotification) {
            AppLog.warn("system", "memory_warning")
        }
        on(ProcessInfo.thermalStateDidChangeNotification) {
            let s = ProcessInfo.processInfo.thermalState
            let kv: [String: any Sendable] = ["state": thermalName(s)]
            if s == .serious || s == .critical { AppLog.warn("system", "thermal_state", kv) } else { AppLog.info("system", "thermal_state", kv) }
        }
        on(.NSProcessInfoPowerStateDidChange) {
            AppLog.info("system", "low_power_mode", ["enabled": ProcessInfo.processInfo.isLowPowerModeEnabled])
        }
    }

    private static var activeLogged = false
}

/// MetricKit delivers yesterday's metrics and any crash/hang/CPU/disk-write diagnostics at the next launch, on an arbitrary
/// queue. Each payload is written as-is to `Documents/logs/diagnostics/` and summarised with one log record.
final class MetricKitReceiver: NSObject, MXMetricManagerSubscriber, @unchecked Sendable {
    func didReceive(_ payloads: [MXMetricPayload]) {
        for p in payloads {
            AppLog.writer.saveDiagnostic(p.jsonRepresentation(), kind: "metrics")
            AppLog.info("metrickit", "metric_payload", ["begin": "\(p.timeStampBegin)", "end": "\(p.timeStampEnd)"])
        }
    }

    func didReceive(_ payloads: [MXDiagnosticPayload]) {
        for p in payloads {
            var kinds: [String] = []
            let crashes = p.crashDiagnostics?.count ?? 0, hangs = p.hangDiagnostics?.count ?? 0
            let cpu = p.cpuExceptionDiagnostics?.count ?? 0, disk = p.diskWriteExceptionDiagnostics?.count ?? 0
            if crashes > 0 { kinds.append("crash") }
            if hangs > 0 { kinds.append("hang") }
            if cpu > 0 { kinds.append("cpu") }
            if disk > 0 { kinds.append("diskwrite") }
            let kind = "diagnostic-" + (kinds.isEmpty ? "other" : kinds.joined(separator: "+"))
            AppLog.writer.saveDiagnostic(p.jsonRepresentation(), kind: kind)
            AppLog.error("metrickit", "diagnostic_payload",
                         ["kinds": kinds, "crashes": crashes, "hangs": hangs, "cpu_exceptions": cpu, "disk_writes": disk])
        }
    }
}
