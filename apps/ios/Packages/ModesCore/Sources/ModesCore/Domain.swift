import Foundation

/// A song outside the on-device catalog (found by search). It plays, but has no features to learn from.
public struct ExternalSong: Hashable, Sendable {
    public let id: String, title: String, artist: String
    public let image: URL?
    public let album: String
    public let albumID: String?
    public let label: String
    public let language: String
    public let year: Int
    public let artistIDs: [String]
    public let composer: String
    public let duration: Double
    public let playCount: Int
    public let explicit: Bool

    public init(id: String, title: String, artist: String, image: URL?, album: String = "",
                albumID: String? = nil, label: String = "", language: String = "", year: Int = 0,
                artistIDs: [String] = [], composer: String = "", duration: Double = 0,
                playCount: Int = 0, explicit: Bool = false) {
        self.id = id; self.title = title; self.artist = artist; self.image = image
        self.album = album; self.albumID = albumID; self.label = label; self.language = language; self.year = year
        self.artistIDs = artistIDs; self.composer = composer; self.duration = duration
        self.playCount = playCount; self.explicit = explicit
    }
}

public struct QueueItem: Identifiable, Hashable, Sendable {
    public let index: Int                   // catalog index, or -1 for an external song
    public var ext: ExternalSong?
    public var why: String
    public var id: String { ext.map { "x:" + $0.id } ?? "c:\(index)" }

    public init(index: Int, ext: ExternalSong? = nil, why: String) {
        self.index = index; self.ext = ext; self.why = why
    }
}
