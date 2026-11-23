import Foundation
import OSLog
import ModesCore

enum AppLog {
    static let subsystem = "com.nandanvarma.modes"
    static let writer = LogWriter()

    static let signposter = OSSignposter(subsystem: subsystem, category: "perf")

    private static let echo = ProcessInfo.processInfo.environment["MODES_LOG_STDOUT"] != nil
    private static let debugEnabled: Bool = {
        #if DEBUG
        return true
        #else
        return ProcessInfo.processInfo.environment["MODES_LOG_DEBUG"] == "1"
        #endif
    }()
    private static let stamp: DateFormatter = { let f = DateFormatter(); f.dateFormat = "HH:mm:ss.SSS"; return f }()

    static var sessionID: String { writer.sessionID }

    static func debug(_ cat: String, _ msg: @autoclosure () -> String, _ kv: [String: any Sendable]? = nil) {
        guard debugEnabled else { return }
        emit(.debug, cat, msg(), kv)
    }
    static func info(_ cat: String, _ msg: @autoclosure () -> String, _ kv: [String: any Sendable]? = nil) { emit(.info, cat, msg(), kv) }
    static func warn(_ cat: String, _ msg: @autoclosure () -> String, _ kv: [String: any Sendable]? = nil) { emit(.warn, cat, msg(), kv) }
    static func error(_ cat: String, _ msg: @autoclosure () -> String, _ kv: [String: any Sendable]? = nil) { emit(.error, cat, msg(), kv) }

    static func metric(_ name: String, _ value: Double, unit: String? = nil, tags: [String: String]? = nil) {
        var kv: [String: any Sendable] = ["value": value]
        if let unit { kv["unit"] = unit }
        if let tags, !tags.isEmpty { kv["tags"] = tags }
        emit(.metric, "metric", name, kv)
    }

    static func span(_ name: String, tags: [String: String]? = nil) -> Span { Span(name: name, tags: tags) }

    struct Span: Sendable {
        let name: String
        let tags: [String: String]?
        private let start = ContinuousClock.now
        private let signpost: OSSignpostIntervalState

        fileprivate init(name: String, tags: [String: String]?) {
            self.name = name
            self.tags = tags
            signpost = AppLog.signposter.beginInterval("span", id: AppLog.signposter.makeSignpostID(), "\(name, privacy: .public)")
        }

        var elapsedMs: Double {
            let d = ContinuousClock.now - start
            return Double(d.components.seconds) * 1000 + Double(d.components.attoseconds) / 1e15
        }

        @discardableResult
        func end(tags extra: [String: String]? = nil) -> Double {
            let ms = elapsedMs
            AppLog.signposter.endInterval("span", signpost, "\(name, privacy: .public)")
            AppLog.metric(name, (ms * 10).rounded() / 10, unit: "ms", tags: tags.merging(extra))
            return ms
        }
    }

    private static let installLock = NSLock()
    nonisolated(unsafe) private static var hooksInstalled = false

    static func installCrashHooks() {
        installLock.lock(); defer { installLock.unlock() }
        guard !hooksInstalled else { return }
        hooksInstalled = true
        NSSetUncaughtExceptionHandler { e in
            AppLog.error("crash", "uncaught \(e.name.rawValue): \(e.reason ?? "")",
                         ["stack": Array(e.callStackSymbols.prefix(12))])
            AppLog.writer.flushAndWait()
        }
    }

    private static func emit(_ level: LogLevel, _ cat: String, _ msg: String, _ kv: [String: any Sendable]?) {
        let logger = Logger(subsystem: subsystem, category: cat)
        switch level {
        case .debug: logger.debug("\(msg, privacy: .public)")
        case .info, .metric: logger.info("\(msg, privacy: .public)")
        case .warn: logger.warning("\(msg, privacy: .public)")
        case .error: logger.error("\(msg, privacy: .public)")
        }
        let now = Date()
        writer.write(level, cat, msg, kv, at: now)
        if echo {
            let tag = level == .info ? "" : "\(level.rawValue.uppercased()) "
            let extra = kv.map { " " + LogFormat.json($0) } ?? ""
            print("\(stamp.string(from: now)) [\(cat)] \(tag)\(msg)\(extra)")
        }
    }
}

private extension Optional where Wrapped == [String: String] {
    func merging(_ other: [String: String]?) -> [String: String]? {
        switch (self, other) {
        case (nil, nil): return nil
        case let (a?, nil): return a
        case let (nil, b?): return b
        case let (a?, b?): return a.merging(b) { $1 }
        }
    }
}
