import Foundation
import Testing
@testable import ModesCore

struct LibraryTests {
    func item(_ id: String, at t: TimeInterval = 0) -> LibraryItem {
        LibraryItem(id: id, title: "T\(id)", artist: "A", imageURL: nil, addedAt: Date(timeIntervalSince1970: t))
    }

    @Test func favoritesAreNewestFirstAndUnique() {
        var lib = LibraryState()
        lib.addFavorite(item("1")); lib.addFavorite(item("2")); lib.addFavorite(item("1"))
        #expect(lib.favorites.map(\.id) == ["1", "2"])
        #expect(lib.isFavorite("2"))
        let removed = lib.removeFavorite("2")
        let removedAgain = lib.removeFavorite("2")
        #expect(removed && !removedAgain)
        #expect(!lib.isFavorite("2"))
    }

    @Test func recentsDedupeAndCap() {
        var lib = LibraryState()
        for i in 0..<70 { lib.recordPlay(item("\(i)")) }
        #expect(lib.recents.count == LibraryState.recentLimit)
        #expect(lib.recents.first?.id == "69")
        lib.recordPlay(item("30"))
        #expect(lib.recents.first?.id == "30")
        #expect(lib.recents.filter { $0.id == "30" }.count == 1)
        lib.clearRecents()
        #expect(lib.recents.isEmpty)
    }

    @Test func stateRoundTrips() throws {
        var lib = LibraryState(); lib.addFavorite(item("1")); lib.recordPlay(item("2"))
        let back = try PropertyListDecoder().decode(LibraryState.self, from: PropertyListEncoder().encode(lib))
        #expect(back == lib)
    }

    @Test func snapshotRestoresEverythingALearningActionTouches() {
        var profile = PersonalizedProfile()
        profile.liked = ["a"]
        let snapshot = PersonalizedSnapshot(profile)
        profile.learner.observe(SparseFeatures(indices: [1], values: [1], labels: ["a|x"]), target: 1, weight: 5)
        profile.liked.append("b"); profile.banned.append("c"); profile.recent.append("c")
        snapshot.restore(into: &profile)
        #expect(profile.learner.observations == 0)
        #expect(profile.liked == ["a"] && profile.banned.isEmpty && profile.recent.isEmpty)
    }
}
