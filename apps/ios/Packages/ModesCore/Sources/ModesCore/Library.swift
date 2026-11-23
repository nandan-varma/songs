import Foundation

/// A saved or recently played song. `id` is "c:<catalogID>" for catalog songs and "x:<jiosaavnID>" for external ones.
public struct LibraryItem: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public var title: String
    public var artist: String
    public var imageURL: URL?
    public var addedAt: Date

    public init(id: String, title: String, artist: String, imageURL: URL? = nil, addedAt: Date = Date()) {
        self.id = id; self.title = title; self.artist = artist; self.imageURL = imageURL; self.addedAt = addedAt
    }

    public static func catalogID(_ id: String) -> String { "c:" + id }
    public static func externalID(_ id: String) -> String { "x:" + id }

    /// The raw catalog song id when this is a catalog item.
    public var catalogSongID: String? { id.hasPrefix("c:") ? String(id.dropFirst(2)) : nil }
    /// The raw JioSaavn id when this is an external item.
    public var externalSongID: String? { id.hasPrefix("x:") ? String(id.dropFirst(2)) : nil }
}

/// Favorites (newest first) and recently played songs (newest first, de-duplicated, capped). Pure value; persisted as part of the app state.
public struct LibraryState: Codable, Equatable, Sendable {
    public static let recentLimit = 50

    public var favorites: [LibraryItem] = []
    public var recents: [LibraryItem] = []

    public init(favorites: [LibraryItem] = [], recents: [LibraryItem] = []) {
        self.favorites = favorites; self.recents = recents
    }

    public func isFavorite(_ id: String) -> Bool { favorites.contains { $0.id == id } }

    /// Adds (or moves to the front) a favorite.
    public mutating func addFavorite(_ item: LibraryItem) {
        favorites.removeAll { $0.id == item.id }
        favorites.insert(item, at: 0)
    }

    @discardableResult
    public mutating func removeFavorite(_ id: String) -> Bool {
        let before = favorites.count
        favorites.removeAll { $0.id == id }
        return favorites.count != before
    }

    /// Records a song that really started playing: moves it to the front, drops duplicates, keeps the newest `recentLimit`.
    public mutating func recordPlay(_ item: LibraryItem) {
        recents.removeAll { $0.id == item.id }
        recents.insert(item, at: 0)
        if recents.count > Self.recentLimit { recents.removeLast(recents.count - Self.recentLimit) }
    }

    public mutating func clearRecents() { recents = [] }
}
