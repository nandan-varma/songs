import Testing
@testable import ModesCore

struct PlaybackLedgerTests {
    @Test func aSongIsAccountedForOnce() {
        var ledger = PlaybackLedger()
        #expect(ledger.closed)
        ledger.begin()
        #expect(!ledger.closed)
        let first = ledger.closeOnce()
        let second = ledger.closeOnce()
        #expect(first)
        #expect(!second)
        #expect(ledger.closed)
    }

    @Test func startingANewSongInvalidatesTheOldGeneration() {
        var ledger = PlaybackLedger()
        let first = ledger.begin()
        #expect(ledger.isCurrent(first))
        ledger.markStarted()
        #expect(ledger.wasHeard)
        let second = ledger.begin()
        #expect(!ledger.isCurrent(first))
        #expect(ledger.isCurrent(second))
        #expect(!ledger.wasHeard)
    }

    @Test func unheardSongsCannotBeLearnedFrom() {
        var ledger = PlaybackLedger()
        ledger.begin()
        #expect(!ledger.wasHeard)
        ledger.markStarted()
        #expect(ledger.wasHeard)
    }

    @Test func failureClosesTheSongWithoutMarkingItHeard() {
        var ledger = PlaybackLedger()
        ledger.begin()
        ledger.markFailed()
        #expect(ledger.closed)
        #expect(!ledger.wasHeard)
        let closedAgain = ledger.closeOnce()
        #expect(!closedAgain)
    }

    @Test func invalidateStopsTheSessionAndDropsInFlightWork() {
        var ledger = PlaybackLedger()
        let generation = ledger.begin()
        ledger.markStarted()
        ledger.invalidate()
        #expect(!ledger.isCurrent(generation))
        #expect(ledger.closed)
        #expect(!ledger.wasHeard)
    }
}
