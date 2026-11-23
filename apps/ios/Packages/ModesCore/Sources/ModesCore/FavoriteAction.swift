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
            } else {
                profile.setLiked(item.id, true)
            }
        } else {
            library.removeFavorite(item.id)
            profile.setLiked(item.id, false)
        }
        return true
    }
}
