import Foundation

public struct PreviousSession: Sendable, Equatable {
    public let id: String

    public let endedCleanly: Bool

    public let breadcrumbs: [String]
}

public enum SessionForensics {
    public static let endMessage = "session_end"
    public static let unexpectedMessage = "previous_session_ended_unexpectedly"

    public static func previousSession(in lines: [String], current: String, breadcrumbCount: Int = 25) -> PreviousSession? {
        var lastID: String?
        var mine: [(line: String, isEnd: Bool)] = []
        for line in lines {
            guard let id = field("session", in: line), id != current else { continue }
            if id != lastID { mine = []; lastID = id }
            let msg = field("msg", in: line)

            if msg == unexpectedMessage { continue }
            mine.append((line, msg == endMessage))
        }
        guard let id = lastID, let last = mine.last else { return nil }
        return PreviousSession(id: id, endedCleanly: last.isEnd, breadcrumbs: Array(mine.suffix(breadcrumbCount).map(\.line)))
    }

    static func field(_ key: String, in line: String) -> String? {
        guard let data = line.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        return obj[key] as? String
    }
}
