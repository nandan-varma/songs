import Foundation

public struct SongDisplay: Equatable, Sendable {
    public let title: String

    public let artist: String

    public let compactArtist: String

    public let context: String?

    public init(title: String, artist: String, compactArtist: String, context: String?) {
        self.title = title; self.artist = artist; self.compactArtist = compactArtist; self.context = context
    }

    public init(title rawTitle: String, artist rawArtist: String, album: String? = nil) {
        let parsed = SongTitle.parse(rawTitle, album: album)
        let names = ArtistLine.names(from: rawArtist)
        self.init(title: parsed.title, artist: ArtistLine.format(names), compactArtist: ArtistLine.compact(names), context: parsed.context)
    }

    public var spoken: String { artist.isEmpty ? title : "\(title), \(artist)" }
}
