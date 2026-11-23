import Foundation

/// One rule for what a favorite means, shared by every screen and by the model's liked set.
public enum FavoriteAction {
    @discardableResult
    public static func set(_ favorite: Bool, item: LibraryItem, song: SongFeatures?,
                           library: inout LibraryState, profile: inout PersonalizedProfile,
                           gate: LearningGate = LearningGate()) -> Bool {
        guard library.isFavorite(item.id) != favorite else { return false }
        if favorite {
            library.addFavorite(item)
            if let song {
                profile.learn(song, signal: .favorite, gate: gate)
            } else if let id = item.catalogSongID ?? item.externalSongID {
                profile.setLiked(id, true)
            }
        } else {
            library.removeFavorite(item.id)
            if let id = item.catalogSongID ?? item.externalSongID {
                profile.setLiked(id, false)
            }
        }
        return true
    }
}
