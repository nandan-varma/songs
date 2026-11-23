import Foundation

/// Everything the on-device model knows about one song before it is played.
public struct SongFeatures: Codable, Hashable, Sendable {
    public var id: String
    public var title: String
    public var artist: String
    public var album: String
    public var albumID: String?
    public var label: String
    public var language: String
    public var year: Int
    public var artistIDs: [String]
    public var composer: String
    public var duration: Double
    public var playCount: Int
    public var explicit: Bool
    public var image: URL?

    public init(id: String, title: String, artist: String, album: String = "", albumID: String? = nil,
                label: String = "", language: String = "", year: Int = 0, artistIDs: [String] = [],
                composer: String = "", duration: Double = 0, playCount: Int = 0, explicit: Bool = false,
                image: URL? = nil) {
        self.id = id
        self.title = title
        self.artist = artist
        self.album = album
        self.albumID = albumID
        self.label = label
        self.language = language
        self.year = year
        self.artistIDs = artistIDs
        self.composer = composer
        self.duration = duration
        self.playCount = playCount
        self.explicit = explicit
        self.image = image
    }

    /// First credited artist, used for the no-repeat-artist rule.
    public var primaryArtist: String {
        artist.split(separator: ",").first.map { $0.trimmingCharacters(in: .whitespaces) } ?? artist
    }

    public var artistNames: [String] {
        artist.split(whereSeparator: { $0 == "," || $0 == "&" })
            .map { $0.trimmingCharacters(in: .whitespaces).lowercased() }
            .filter { !$0.isEmpty }
    }

    public var titleWords: [String] {
        title.lowercased()
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .filter { $0.count >= 2 }
    }
}
