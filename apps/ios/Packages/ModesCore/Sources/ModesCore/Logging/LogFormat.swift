import Foundation

/// Severity of a structured log record. `metric` records carry a numeric `value` in `kv`.
public enum LogLevel: String, Sendable, CaseIterable {
    case debug, info, warn, error, metric

    /// Records at or above this level are flushed to disk immediately instead of waiting for the buffer.
    public var flushesImmediately: Bool { self == .warn || self == .error }
}

/// Pure formatting for the JSON-lines log. No UIKit, no file IO, so it is unit-testable on the command line.
public enum LogFormat {
    /// `2026-11-22T10:15:30.123Z` (UTC, millisecond precision).
    public static func iso8601(_ date: Date) -> String {
        let c = components(date)
        return String(format: "%04d-%02d-%02dT%02d:%02d:%02d.%03dZ", c.year, c.month, c.day, c.hour, c.minute, c.second, c.millis)
    }

    /// `20261122-101530-123`, for file names that sort chronologically.
    public static func fileStamp(_ date: Date) -> String {
        let c = components(date)
        return String(format: "%04d%02d%02d-%02d%02d%02d-%03d", c.year, c.month, c.day, c.hour, c.minute, c.second, c.millis)
    }

    /// One record as a single JSON line, keys in a fixed, readable order: ts, level, cat, msg, session, seq, kv.
    public static func line(ts: Date, level: LogLevel, cat: String, msg: String, session: String, seq: Int,
                            kv: [String: any Sendable]? = nil) -> String {
        var out = "{\"ts\":\(quote(iso8601(ts)))"
        out += ",\"level\":\(quote(level.rawValue)),\"cat\":\(quote(cat)),\"msg\":\(quote(msg))"
        out += ",\"session\":\(quote(session)),\"seq\":\(seq)"
        if let kv, !kv.isEmpty { out += ",\"kv\":\(json(kv))" }
        return out + "}"
    }

    /// Compact `{"a":1,"b":"x"}` rendering of an arbitrary value, with keys sorted. Non-JSON values fall back to their description.
    public static func json(_ value: Any) -> String {
        let safe = sanitize(value)
        guard JSONSerialization.isValidJSONObject(safe) || safe is String || safe is NSNumber || safe is NSNull,
              let data = try? JSONSerialization.data(withJSONObject: safe, options: [.sortedKeys, .withoutEscapingSlashes, .fragmentsAllowed])
        else { return quote(String(describing: value)) }
        return String(decoding: data, as: UTF8.self)
    }

    static func quote(_ s: String) -> String { json(s) }

    static func sanitize(_ value: Any) -> Any {
        switch value {
        case let v as String: return v
        case let v as Bool: return v
        case let v as Int: return v
        case let v as Int64: return v
        case let v as UInt64: return v > UInt64(Int64.max) ? String(v) : Int64(v)
        case let v as Double: return v.isFinite ? v : String(v)
        case let v as Float: return v.isFinite ? Double(v) : String(v)
        case let v as Date: return iso8601(v)
        case let v as URL: return v.absoluteString
        case let v as [String: Any]: return v.mapValues(sanitize)
        case let v as [Any]: return v.map(sanitize)
        case let v as any BinaryInteger: return Int64(truncatingIfNeeded: v)
        case let v as Optional<Any> where v == nil: return NSNull()
        default: return String(describing: value)
        }
    }

    private struct Parts { var year, month, day, hour, minute, second, millis: Int }

    private static func components(_ date: Date) -> Parts {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "UTC")!
        let totalMs = Int64((date.timeIntervalSince1970 * 1000).rounded())   // round, so .123 does not become .122
        let whole = Date(timeIntervalSince1970: Double(totalMs.floorDiv(1000)))
        let c = cal.dateComponents([.year, .month, .day, .hour, .minute, .second], from: whole)
        let ms = Int(totalMs - totalMs.floorDiv(1000) * 1000)
        return Parts(year: c.year ?? 0, month: c.month ?? 0, day: c.day ?? 0, hour: c.hour ?? 0, minute: c.minute ?? 0,
                     second: c.second ?? 0, millis: ms)
    }
}

/// Which files to delete so that only the newest `keep` remain. Names must sort chronologically (they embed a UTC stamp).
public enum LogRetention {
    public static func excess(_ names: [String], keep: Int) -> [String] {
        let sorted = names.sorted()
        return sorted.count > keep ? Array(sorted.prefix(sorted.count - keep)) : []
    }
}

private extension Int64 {
    func floorDiv(_ d: Int64) -> Int64 { let q = self / d; return (self % d != 0 && (self < 0) != (d < 0)) ? q - 1 : q }
}
