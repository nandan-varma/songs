import Testing
@testable import ModesCore

struct ListenerQueueTests {
    private func song(_ id: Int, why: String) -> QueueItem {
        QueueItem(song: SongFeatures(id: "\(id)", title: "T\(id)", artist: "A"), why: why)
    }

    @Test func explicitPicksSurviveRefreshWithoutDuplicates() {
        var queue = ListenerQueue()
        queue.prepend(song(3, why: "Queued"))
        queue.prepend(song(4, why: "Queued"))
        queue.prepend(song(3, why: "Queued again"))
        let refreshed = queue.combining([song(3, why: "Recommended"), song(8, why: "Recommended")], excluding: nil)
        #expect(refreshed.map(\.id) == ["3", "4", "8"])
        #expect(refreshed.first?.why == "Queued again")
    }

    @Test func consumedAndCurrentSongsAreNotPinnedAgain() {
        var queue = ListenerQueue()
        queue.prepend(song(2, why: "Queued"))
        queue.prepend(song(5, why: "Queued"))
        queue.consume(id: "5")
        let refreshed = queue.combining([song(5, why: "Recommended")], excluding: "5")
        #expect(refreshed.map(\.id) == ["2"])
    }

    @Test func intentionallyQueuedReplayIsKept() {
        var queue = ListenerQueue()
        queue.prepend(song(2, why: "Replay next"))
        #expect(queue.combining([], excluding: "2").map(\.id) == ["2"])
    }

    @Test func networkResponsesKeepTheOrderOfUserActions() {
        var queue = ListenerQueue()
        let older = queue.reservePosition()
        let newer = queue.reservePosition()
        queue.prepend(song(2, why: "Second gesture"), position: newer)
        queue.prepend(song(1, why: "First gesture, slow response"), position: older)
        #expect(queue.items.map(\.id) == ["2", "1"])
        queue.prepend(song(2, why: "Stale response"), position: older)
        #expect(queue.items.first?.why == "Second gesture")
    }

    @Test func staleResolveCannotRequeueAnAlreadyConsumedPick() {
        var queue = ListenerQueue()
        let older = queue.reservePosition(for: "2")
        let newer = queue.reservePosition(for: "2")
        queue.prepend(song(2, why: "Newer"), position: newer)
        queue.consume(id: "2")
        let inserted = queue.prepend(song(2, why: "Stale response"), position: older)
        #expect(!inserted)
        #expect(queue.items.isEmpty)
    }

    @Test func aTappedListKeepsItsOrderAndPlayNextStillGoesFirst() {
        var queue = ListenerQueue()
        let list = [song(5, why: "list"), song(6, why: "list"), song(7, why: "list")]
        queue.replacePins(with: list)
        #expect(queue.combining([], excluding: nil).map(\.id) == ["5", "6", "7"])
        queue.prepend(song(9, why: "Play next"))
        #expect(queue.combining([song(8, why: "Recommended")], excluding: nil).map(\.id) == ["9", "5", "6", "7", "8"])
        queue.consume(id: "5")
        #expect(queue.combining([], excluding: "5").map(\.id) == ["9", "6", "7"])
    }

    @Test func playLastStaysAfterRecommendationsAndDisappearsOncePlayed() {
        var queue = ListenerQueue()
        queue.prepend(song(5, why: "Play next"))
        queue.appendLast(song(9, why: "Play last"))
        let combined = queue.combining([song(8, why: "Recommended")], excluding: nil)
        #expect(combined.map(\.id) == ["5", "8", "9"])
        queue.consume(id: "9")
        #expect(queue.combining([], excluding: nil).map(\.id) == ["5"])
    }

    @Test func everyUserQueueChangeBumpsTheRevision() {
        var queue = ListenerQueue()
        let start = queue.revision
        queue.reservePosition()
        #expect(queue.revision > start)
        let reserved = queue.revision
        queue.prepend(song(1, why: "Queued"))
        #expect(queue.revision > reserved)
        let pinned = queue.revision
        queue.appendLast(song(2, why: "Last"))
        #expect(queue.revision > pinned)
    }

    @Test func startingASongInvalidatesAnInFlightQueueRanking() {
        var queue = ListenerQueue()
        queue.prepend(song(1, why: "Queued"))
        let before = queue.revision
        queue.consume(id: "1")
        #expect(queue.revision > before)
        #expect(queue.items.isEmpty)
    }

    @Test func onlyReplacingTheQueueBumpsTheClearGeneration() {
        var queue = ListenerQueue()
        let start = queue.clearGeneration
        queue.reservePosition()
        queue.prepend(song(1, why: "Queued"))
        queue.appendLast(song(2, why: "Last"))
        #expect(queue.clearGeneration == start)
        queue.replacePins(with: [song(3, why: "List")])
        #expect(queue.clearGeneration > start)
        let replaced = queue.clearGeneration
        queue.clear()
        #expect(queue.clearGeneration > replaced)
    }

    @Test func clearingInvalidatesPendingResolveAndRemovesPicks() {
        var queue = ListenerQueue()
        let revision = queue.revision
        queue.prepend(song(1, why: "Queued"))
        queue.clear()
        #expect(queue.revision != revision)
        #expect(queue.items.isEmpty)
        #expect(queue.combining([song(7, why: "Recommended")], excluding: nil).map(\.id) == ["7"])
    }
}
