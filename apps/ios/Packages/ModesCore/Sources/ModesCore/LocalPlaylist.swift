import Foundation

/// A listener-made playlist. Editorial playlists come from the API and are not stored here.
public struct LocalPlaylist: Codable, Identifiable, Hashable, Sendable {
    public var id: UUID
    public var name: String
    public var songs: [LibraryItem]
    public var created: Date

    public init(id: UUID = UUID(), name: String, songs: [LibraryItem] = [], created: Date = Date()) {
        self.id = id; self.name = name; self.songs = songs; self.created = created
    }

    @discardableResult
    public mutating func add(_ item: LibraryItem) -> Bool {
        guard !songs.contains(where: { $0.id == item.id }) else { return false }
        songs.append(item)
        return true
    }

    @discardableResult
    public mutating func remove(songID: String) -> Bool {
        let before = songs.count
        songs.removeAll { $0.id == songID }
        return songs.count != before
    }

    @discardableResult
    public mutating func rename(_ newName: String) -> Bool {
        let trimmed = newName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, trimmed != name else { return false }
        name = trimmed
        return true
    }
}
