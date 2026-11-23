import Foundation
import Testing
@testable import ModesCore

struct SleepTimerTests {
    let now = Date(timeIntervalSince1970: 1_000)

    @Test func idleBeforeTheFadeWindow() {
        #expect(SleepTimerLogic.decide(now: now, deadline: now.addingTimeInterval(60)) == .none)
        #expect(SleepTimerLogic.decide(now: now, deadline: now.addingTimeInterval(8)) == .none)
    }

    @Test func fadesLinearlyInTheFinalSeconds() {
        #expect(SleepTimerLogic.decide(now: now, deadline: now.addingTimeInterval(4)) == .fade(volume: 0.5))
        #expect(SleepTimerLogic.decide(now: now, deadline: now.addingTimeInterval(2)) == .fade(volume: 0.25))
    }

    @Test func firesAtAndAfterTheDeadline() {
        #expect(SleepTimerLogic.decide(now: now, deadline: now) == .fire)
        #expect(SleepTimerLogic.decide(now: now, deadline: now.addingTimeInterval(-300)) == .fire)
    }

    @Test func deadlines() {
        #expect(SleepTimer.minutes(15).deadline(from: now) == now.addingTimeInterval(900))
        #expect(SleepTimer.minutes(0).deadline(from: now) == nil)
        #expect(SleepTimer.endOfSong.deadline(from: now) == nil)
        #expect(SleepTimer.off.deadline(from: now) == nil)
    }

    @Test func codableRoundTrip() throws {
        for t in [SleepTimer.off, .minutes(30), .endOfSong] {
            #expect(try JSONDecoder().decode(SleepTimer.self, from: JSONEncoder().encode(t)) == t)
        }
    }
}
