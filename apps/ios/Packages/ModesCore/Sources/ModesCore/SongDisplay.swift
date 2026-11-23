import Foundation

/// Everything the UI shows for one song, derived once from the raw API strings.
public struct SongDisplay: Equatable, Sendable {
    public let title: String
    /// "A", "A & B", "A, B & C".
    public let artist: String
    /// "A, B +1" for narrow rows.
    public let compactArtist: String
    /// The film or album, when it adds information.
    public let context: String?

    public init(title: String, artist: String, compactArtist: String, context: String?) {
        self.title = title; self.artist = artist; self.compactArtist = compactArtist; self.context = context
    }

    public init(title rawTitle: String, artist rawArtist: String, album: String? = nil) {
        let parsed = SongTitle.parse(rawTitle, album: album)
        let names = ArtistLine.names(from: rawArtist)
        self.init(title: parsed.title, artist: ArtistLine.format(names), compactArtist: ArtistLine.compact(names), context: parsed.context)
    }

    /// "Title by Artist", for VoiceOver.
    public var spoken: String { artist.isEmpty ? title : "\(title), \(artist)" }
}
