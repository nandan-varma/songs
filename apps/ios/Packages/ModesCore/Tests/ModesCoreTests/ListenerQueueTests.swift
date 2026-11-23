import Testing
@testable import ModesCore

struct ListenerQueueTests {
    @Test func explicitPicksSurviveRefreshWithoutDuplicates() {
        var queue = ListenerQueue()
        queue.prepend(QueueItem(index: 3, why: "Queued"))
        queue.prepend(QueueItem(index: 4, why: "Queued"))
        queue.prepend(QueueItem(index: 3, why: "Queued again"))
        let refreshed = queue.combining([QueueItem(index: 3, why: "Recommended"), QueueItem(index: 8, why: "Recommended")], excluding: nil)
        #expect(refreshed.map(\.index) == [3, 4, 8])
        #expect(refreshed.first?.why == "Queued again")
    }

    @Test func consumedAndCurrentSongsAreNotPinnedAgain() {
        var queue = ListenerQueue()
        queue.prepend(QueueItem(index: 2, why: "Queued"))
        queue.prepend(QueueItem(index: 5, why: "Queued"))
        queue.consume(id: "c:5")
        let refreshed = queue.combining([QueueItem(index: 5, why: "Recommended")], excluding: "c:5")
        #expect(refreshed.map(\.index) == [2])
    }

    @Test func intentionallyQueuedReplayIsKept() {
        var queue = ListenerQueue()
        queue.prepend(QueueItem(index: 2, why: "Replay next"))
        #expect(queue.combining([], excluding: "c:2").map(\.index) == [2])
    }

    @Test func networkResponsesKeepTheOrderOfUserActions() {
        var queue = ListenerQueue()
        let older = queue.reservePosition()
        let newer = queue.reservePosition()
        queue.prepend(QueueItem(index: 2, why: "Second gesture"), position: newer)
        queue.prepend(QueueItem(index: 1, why: "First gesture, slow response"), position: older)
        #expect(queue.items.map(\.index) == [2, 1])
        queue.prepend(QueueItem(index: 2, why: "Stale response"), position: older)
        #expect(queue.items.first?.why == "Second gesture")
    }

    @Test func staleResolveCannotRequeueAnAlreadyConsumedPick() {
        var queue = ListenerQueue()
        let older = queue.reservePosition(for: "c:2")
        let newer = queue.reservePosition(for: "c:2")
        queue.prepend(QueueItem(index: 2, why: "Newer"), position: newer)
        queue.consume(id: "c:2")
        let inserted = queue.prepend(QueueItem(index: 2, why: "Stale response"), position: older)
        #expect(!inserted)
        #expect(queue.items.isEmpty)
    }

    @Test func aTappedListKeepsItsOrderAndPlayNextStillGoesFirst() {
        var queue = ListenerQueue()
        let list = [QueueItem(index: 5, why: "list"), QueueItem(index: 6, why: "list"), QueueItem(index: 7, why: "list")]
        queue.replacePins(with: list)
        #expect(queue.combining([], excluding: nil).map(\.index) == [5, 6, 7])
        queue.prepend(QueueItem(index: 9, why: "Play next"))
        #expect(queue.combining([QueueItem(index: 8, why: "Recommended")], excluding: nil).map(\.index) == [9, 5, 6, 7, 8])
        queue.consume(id: "c:5")
        #expect(queue.combining([], excluding: "c:5").map(\.index) == [9, 6, 7])
    }

    @Test func playLastStaysAfterRecommendationsAndDisappearsOncePlayed() {
        var queue = ListenerQueue()
        queue.prepend(QueueItem(index: 5, why: "Play next"))
        queue.appendLast(QueueItem(index: 9, why: "Play last"))
        let combined = queue.combining([QueueItem(index: 8, why: "Recommended")], excluding: nil)
        #expect(combined.map(\.index) == [5, 8, 9])
        queue.consume(id: "c:9")
        #expect(queue.combining([], excluding: nil).map(\.index) == [5])
    }

    @Test func everyUserQueueChangeBumpsTheRevision() {
        var queue = ListenerQueue()
        let start = queue.revision
        queue.reservePosition()
        #expect(queue.revision > start)
        let reserved = queue.revision
        queue.prepend(QueueItem(index: 1, why: "Queued"))
        #expect(queue.revision > reserved)
        let pinned = queue.revision
        queue.appendLast(QueueItem(index: 2, why: "Last"))
        #expect(queue.revision > pinned)
    }

    @Test func startingASongInvalidatesAnInFlightQueueRanking() {
        var queue = ListenerQueue()
        queue.prepend(QueueItem(index: 1, why: "Queued"))
        let before = queue.revision
        queue.consume(id: "c:1")
        #expect(queue.revision > before)
        #expect(queue.items.isEmpty)
    }

    @Test func onlyReplacingTheQueueBumpsTheClearGeneration() {
        var queue = ListenerQueue()
        let start = queue.clearGeneration
        queue.reservePosition()
        queue.prepend(QueueItem(index: 1, why: "Queued"))
        queue.appendLast(QueueItem(index: 2, why: "Last"))
        #expect(queue.clearGeneration == start)
        queue.replacePins(with: [QueueItem(index: 3, why: "List")])
        #expect(queue.clearGeneration > start)
        let replaced = queue.clearGeneration
        queue.clear()
        #expect(queue.clearGeneration > replaced)
    }

    @Test func clearingInvalidatesPendingResolveAndRemovesPicks() {
        var queue = ListenerQueue()
        let revision = queue.revision
        queue.prepend(QueueItem(index: 1, why: "Queued"))
        queue.clear()
        #expect(queue.revision != revision)
        #expect(queue.items.isEmpty)
        #expect(queue.combining([QueueItem(index: 7, why: "Recommended")], excluding: nil).map(\.index) == [7])
    }
}
