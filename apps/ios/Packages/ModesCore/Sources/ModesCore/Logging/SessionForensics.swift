import Foundation

/// What the log says about the session that ran before this one.
public struct PreviousSession: Sendable, Equatable {
    public let id: String
    /// True when the session's last record is a `session_end` (clean exit, or backgrounded before suspension).
    public let endedCleanly: Bool
    /// The session's last log lines (raw JSON), oldest first.
    public let breadcrumbs: [String]
}

/// Finds out whether the previous process died without saying goodbye (crash, jetsam, force quit while running).
/// Works on raw JSON lines so it needs no schema beyond `"session":"..."` and `"msg":"session_end"`.
public enum SessionForensics {
    public static let endMessage = "session_end"
    public static let unexpectedMessage = "previous_session_ended_unexpectedly"

    /// - Parameters:
    ///   - lines: the tail of the newest log file, oldest first (the first line may be cut off and is ignored if unparsable).
    ///   - current: the id of the session that is starting now; its own lines are never treated as "previous".
    public static func previousSession(in lines: [String], current: String, breadcrumbCount: Int = 25) -> PreviousSession? {
        var lastID: String?
        var mine: [(line: String, isEnd: Bool)] = []
        for line in lines {
            guard let id = field("session", in: line), id != current else { continue }
            if id != lastID { mine = []; lastID = id }
            let msg = field("msg", in: line)
            // That record repeats an older session's breadcrumbs; embedding it again would grow the line on every launch.
            if msg == unexpectedMessage { continue }
            mine.append((line, msg == endMessage))
        }
        guard let id = lastID, let last = mine.last else { return nil }
        return PreviousSession(id: id, endedCleanly: last.isEnd, breadcrumbs: Array(mine.suffix(breadcrumbCount).map(\.line)))
    }

    /// Extracts a top-level string field from one of our own log lines without a full JSON parse.
    static func field(_ key: String, in line: String) -> String? {
        guard let data = line.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        return obj[key] as? String
    }
}
