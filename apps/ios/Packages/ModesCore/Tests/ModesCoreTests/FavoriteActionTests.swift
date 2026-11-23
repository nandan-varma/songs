import Foundation
import Testing
@testable import ModesCore

struct FavoriteActionTests {
    private func item() -> LibraryItem {
        LibraryItem(id: "song", title: "Song", artist: "Artist")
    }

    private func song() -> SongFeatures {
        SongFeatures(id: "song", title: "Song", artist: "Artist")
    }

    @Test func favoriteUpdatesLibraryAndLikedAndLearns() {
        var library = LibraryState()
        var profile = PersonalizedProfile()
        let changed = FavoriteAction.set(true, item: item(), song: song(), encoder: TestEncoder.encoder, library: &library, profile: &profile)
        #expect(changed)
        #expect(library.isFavorite(item().id))
        #expect(profile.liked == ["song"])
        #expect(profile.learner.observations == 1)
        #expect(!FavoriteAction.set(true, item: item(), song: song(), encoder: TestEncoder.encoder, library: &library, profile: &profile))
    }

    @Test func unfavoriteRemovesBoth() {
        var library = LibraryState()
        var profile = PersonalizedProfile()
        FavoriteAction.set(true, item: item(), song: song(), encoder: TestEncoder.encoder, library: &library, profile: &profile)
        #expect(FavoriteAction.set(false, item: item(), song: nil, encoder: TestEncoder.encoder, library: &library, profile: &profile))
        #expect(!library.isFavorite(item().id))
        #expect(profile.liked.isEmpty)
    }

    @Test func listFavoriteWithoutPlaybackDoesNotTrainTheModel() {
        var library = LibraryState()
        var profile = PersonalizedProfile()
        FavoriteAction.set(true, item: item(), song: nil, encoder: TestEncoder.encoder, library: &library, profile: &profile)
        #expect(library.isFavorite(item().id))
        #expect(profile.liked == ["song"])
        #expect(profile.learner.observations == 0)
    }

    @Test func pausedFavoriteUpdatesCollectionsButNotWeights() {
        var library = LibraryState()
        var profile = PersonalizedProfile()
        FavoriteAction.set(true, item: item(), song: song(), encoder: TestEncoder.encoder, library: &library,
                           profile: &profile, gate: LearningGate(paused: true))
        #expect(library.isFavorite(item().id))
        #expect(profile.liked == ["song"])
        #expect(profile.learner.observations == 0)
    }
}
