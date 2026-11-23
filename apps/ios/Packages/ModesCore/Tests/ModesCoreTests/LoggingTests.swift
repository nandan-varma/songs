import Foundation
import Testing
@testable import ModesCore

struct LoggingTests {
    @Test func lineIsStableJSONWithOptionalKV() throws {
        let d = Date(timeIntervalSince1970: 1_700_000_000.123)
        let l = LogFormat.line(ts: d, level: .warn, cat: "player", msg: "stall \"x\"", session: "ab12cd", seq: 7,
                               kv: ["ms": 12.5, "ok": false, "tags": ["a", "b"], "inf": Double.infinity])
        let obj = try #require(JSONSerialization.jsonObject(with: Data(l.utf8)) as? [String: Any])
        #expect(obj["ts"] as? String == "2023-11-14T22:13:20.123Z")
        #expect(obj["level"] as? String == "warn")
        #expect(obj["seq"] as? Int == 7)
        let kv = try #require(obj["kv"] as? [String: Any])
        #expect(kv["ms"] as? Double == 12.5)
        #expect(kv["inf"] as? String == "inf")
        #expect(!LogFormat.line(ts: d, level: .info, cat: "c", msg: "m", session: "s", seq: 1).contains("kv"))
        #expect(!l.contains("\n"))
    }

    @Test func fileStampSortsChronologically() {
        let a = LogFormat.fileStamp(Date(timeIntervalSince1970: 1_700_000_000))
        let b = LogFormat.fileStamp(Date(timeIntervalSince1970: 1_700_000_001))
        #expect(a == "20231114-221320-000")
        #expect(a < b)
    }

    @Test func retentionDeletesOldestOnly() {
        let names = ["c", "a", "d", "b"]
        #expect(LogRetention.excess(names, keep: 3) == ["a"])
        #expect(LogRetention.excess(names, keep: 4).isEmpty)
        #expect(LogRetention.excess(names, keep: 0) == ["a", "b", "c", "d"])
    }

    private func rec(_ session: String, _ msg: String) -> String {
        LogFormat.line(ts: .now, level: .info, cat: "t", msg: msg, session: session, seq: 1)
    }

    @Test func detectsUnexpectedEnding() throws {
        let lines = [rec("A", "session_start"), rec("A", "session_end"), rec("B", "session_start"), rec("B", "play"), rec("B", "resolve")]
        let prev = try #require(SessionForensics.previousSession(in: lines, current: "C", breadcrumbCount: 2))
        #expect(prev.id == "B")
        #expect(!prev.endedCleanly)
        #expect(prev.breadcrumbs.count == 2)
        #expect(prev.breadcrumbs.last == lines.last)
    }

    @Test func cleanEndingAndOwnLinesIgnored() throws {
        let lines = [rec("A", "x"), rec("A", "session_end"), rec("C", "session_start")]
        let prev = try #require(SessionForensics.previousSession(in: lines, current: "C"))
        #expect(prev.id == "A" && prev.endedCleanly)
        #expect(SessionForensics.previousSession(in: [rec("C", "x")], current: "C") == nil)
        #expect(SessionForensics.previousSession(in: ["{\"garbage", ""], current: "C") == nil)
    }

    @Test func nestedUnexpectedRecordsStayOutOfBreadcrumbs() throws {
        let payload = String(repeating: "x", count: 4_000)
        let nested = LogFormat.line(ts: .now, level: .warn, cat: "session", msg: SessionForensics.unexpectedMessage,
                                    session: "B", seq: 2, kv: ["previous_session": "A", "breadcrumbs": [payload]])
        let lines = [rec("B", "session_start"), nested, rec("B", "play")]
        let prev = try #require(SessionForensics.previousSession(in: lines, current: "C"))
        #expect(prev.id == "B")
        #expect(!prev.endedCleanly)
        #expect(prev.breadcrumbs.count == 2)
        #expect(!prev.breadcrumbs.contains { $0.contains(payload) })
    }

    @Test func resumedAfterBackgroundCountsAsRunning() throws {
        let lines = [rec("A", "session_end"), rec("A", "playing")]
        #expect(try #require(SessionForensics.previousSession(in: lines, current: "B")).endedCleanly == false)
    }

    @Test func frameSignatureThreshold() throws {
        let n = FrameSignature.side * FrameSignature.side
        let base = try #require(FrameSignature(pixels: [UInt8](repeating: 100, count: n)))
        var tick = [UInt8](repeating: 100, count: n); for i in 0..<4 { tick[i] = 255 }   // a thin progress bar
        let small = try #require(FrameSignature(pixels: tick))
        let other = try #require(FrameSignature(pixels: [UInt8](repeating: 160, count: n)))
        #expect(FrameSignature.isNew(base, since: nil))
        #expect(!FrameSignature.isNew(small, since: base))
        #expect(FrameSignature.isNew(other, since: base))
        #expect(FrameSignature(pixels: [1, 2]) == nil)
    }
}
