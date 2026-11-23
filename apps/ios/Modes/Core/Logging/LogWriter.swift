import Foundation
import ModesCore

final class LogWriter: @unchecked Sendable {
    static let maxFileBytes = 1_000_000
    static let keepFiles = 3
    static let flushLineCount = 32
    static let flushDelay: DispatchTimeInterval = .seconds(2)

    let sessionID: String
    let directory: URL
    let diagnosticsDirectory: URL

    private let queue = DispatchQueue(label: "com.nandanvarma.modes.log", qos: .utility)
    private var buffer: [String] = []
    private var flushScheduled = false
    private var handle: FileHandle?
    private var fileSize = 0
    private var seq = 0

    private var previousEndedCleanly: Bool?

    init() {
        sessionID = String(UUID().uuidString.prefix(6)).lowercased()
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        directory = docs.appendingPathComponent("logs", isDirectory: true)
        diagnosticsDirectory = directory.appendingPathComponent("diagnostics", isDirectory: true)
        queue.async { [self] in bootstrap() }
    }

    func write(_ level: LogLevel, _ cat: String, _ msg: String, _ kv: [String: any Sendable]?, at ts: Date = Date()) {
        queue.async { [self] in append(level, cat, msg, kv, ts) }
    }

    func flush() { queue.async { [self] in flushBuffer() } }

    func flushAndWait() { queue.sync { flushBuffer() } }

    func logSessionStart(_ kv: [String: any Sendable]) {
        queue.async { [self] in
            var k = kv
            k["previous_clean"] = previousEndedCleanly ?? true
            append(.info, "session", "session_start", k, Date())
        }
    }

    func logSessionEnd(_ kv: [String: any Sendable], completion: (@Sendable () -> Void)? = nil) {
        queue.async { [self] in
            append(.info, "session", SessionForensics.endMessage, kv, Date())
            flushBuffer()
            completion?()
        }
    }

    func logSessionEndAndWait(_ kv: [String: any Sendable]) {
        queue.sync {
            append(.info, "session", SessionForensics.endMessage, kv, Date())
            flushBuffer()
        }
    }

    private func bootstrap() {
        let fm = FileManager.default
        try? fm.createDirectory(at: diagnosticsDirectory, withIntermediateDirectories: true)
        let files = logFiles()
        if let newest = files.last {
            let tail = Self.tailLines(of: newest, maxBytes: 192 * 1024)
            if let prev = SessionForensics.previousSession(in: tail, current: sessionID) {
                previousEndedCleanly = prev.endedCleanly
                if !prev.endedCleanly {
                    append(.warn, "session", SessionForensics.unexpectedMessage,
                           ["previous_session": prev.id, "breadcrumbs": prev.breadcrumbs], Date())
                }
            } else {
                previousEndedCleanly = true
            }
            let size = (try? fm.attributesOfItem(atPath: newest.path)[.size] as? Int) ?? 0
            if size < Self.maxFileBytes { open(newest, size: size) }
        } else {
            previousEndedCleanly = true
        }
    }

    private func append(_ level: LogLevel, _ cat: String, _ msg: String, _ kv: [String: any Sendable]?, _ ts: Date) {
        seq += 1
        buffer.append(LogFormat.line(ts: ts, level: level, cat: cat, msg: msg, session: sessionID, seq: seq, kv: kv))
        if level.flushesImmediately || buffer.count >= Self.flushLineCount {
            flushBuffer()
        } else if !flushScheduled {
            flushScheduled = true
            queue.asyncAfter(deadline: .now() + Self.flushDelay) { [self] in flushBuffer() }
        }
    }

    private func flushBuffer() {
        flushScheduled = false
        guard !buffer.isEmpty else { return }
        let lines = buffer
        buffer.removeAll(keepingCapacity: true)
        let data = Data((lines.joined(separator: "\n") + "\n").utf8)
        if handle == nil || fileSize + data.count > Self.maxFileBytes { rotate() }
        do {
            try handle?.write(contentsOf: data)
            fileSize += data.count
        } catch {
            handle = nil
        }
    }

    private func rotate() {
        try? handle?.close()
        handle = nil
        let name = "modes-\(LogFormat.fileStamp(Date())).jsonl"
        let url = directory.appendingPathComponent(name)
        FileManager.default.createFile(atPath: url.path, contents: nil)
        open(url, size: 0)
        for old in LogRetention.excess(logFiles().map(\.lastPathComponent), keep: Self.keepFiles) {
            try? FileManager.default.removeItem(at: directory.appendingPathComponent(old))
        }
    }

    private func open(_ url: URL, size: Int) {
        guard let h = try? FileHandle(forWritingTo: url) else { return }
        _ = try? h.seekToEnd()
        handle = h
        fileSize = size
    }

    private func logFiles() -> [URL] {
        let all = (try? FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil)) ?? []
        return all.filter { $0.lastPathComponent.hasPrefix("modes-") && $0.pathExtension == "jsonl" }
            .sorted { $0.lastPathComponent < $1.lastPathComponent }
    }

    private static func tailLines(of url: URL, maxBytes: Int) -> [String] {
        guard let h = try? FileHandle(forReadingFrom: url) else { return [] }
        defer { try? h.close() }
        guard let end = try? h.seekToEnd() else { return [] }
        let start = end > UInt64(maxBytes) ? end - UInt64(maxBytes) : 0
        try? h.seek(toOffset: start)
        guard let data = try? h.readToEnd() else { return [] }
        return String(decoding: data, as: UTF8.self).split(separator: "\n").map(String.init)
    }

    func saveDiagnostic(_ json: Data, kind: String) {
        queue.async { [self] in
            let url = diagnosticsDirectory.appendingPathComponent("\(LogFormat.fileStamp(Date()))-\(kind).json")
            try? FileManager.default.createDirectory(at: diagnosticsDirectory, withIntermediateDirectories: true)
            try? json.write(to: url, options: .atomic)
            let names = ((try? FileManager.default.contentsOfDirectory(atPath: diagnosticsDirectory.path)) ?? []).filter { $0.hasSuffix(".json") }
            for old in LogRetention.excess(names, keep: 40) { try? FileManager.default.removeItem(at: diagnosticsDirectory.appendingPathComponent(old)) }
        }
    }
}
