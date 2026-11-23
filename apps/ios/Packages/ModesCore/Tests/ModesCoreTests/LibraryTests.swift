import Foundation
import Testing
@testable import ModesCore

struct LibraryTests {
    func item(_ id: String, at t: TimeInterval = 0) -> LibraryItem {
        LibraryItem(id: id, title: "T\(id)", artist: "A", imageURL: nil, addedAt: Date(timeIntervalSince1970: t))
    }

    @Test func favoritesAreNewestFirstAndUnique() {
        var lib = LibraryState()
        lib.addFavorite(item("c:1")); lib.addFavorite(item("c:2")); lib.addFavorite(item("c:1"))
        #expect(lib.favorites.map(\.id) == ["c:1", "c:2"])
        #expect(lib.isFavorite("c:2"))
        let removed = lib.removeFavorite("c:2")
        let removedAgain = lib.removeFavorite("c:2")
        #expect(removed && !removedAgain)
        #expect(!lib.isFavorite("c:2"))
    }

    @Test func recentsDedupeAndCap() {
        var lib = LibraryState()
        for i in 0..<70 { lib.recordPlay(item("c:\(i)")) }
        #expect(lib.recents.count == LibraryState.recentLimit)
        #expect(lib.recents.first?.id == "c:69")
        lib.recordPlay(item("c:30"))
        #expect(lib.recents.first?.id == "c:30")
        #expect(lib.recents.filter { $0.id == "c:30" }.count == 1)
        lib.clearRecents()
        #expect(lib.recents.isEmpty)
    }

    @Test func idHelpers() {
        #expect(item("c:abc").catalogSongID == "abc")
        #expect(item("x:zz").externalSongID == "zz")
        #expect(item("x:zz").catalogSongID == nil)
    }

    @Test func stateRoundTrips() throws {
        var lib = LibraryState(); lib.addFavorite(item("c:1")); lib.recordPlay(item("x:2"))
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
