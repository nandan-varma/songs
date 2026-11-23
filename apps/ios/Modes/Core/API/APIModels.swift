import Foundation
import ModesCore

struct Resolved: Sendable {
    let id: String
    let url: URL
    let image: URL?
    let duration: Double
    let hasLyrics: Bool
}

struct Delivery: Hashable, Sendable {
    var quality: QualityPreference
    var allowExplicit: Bool
    var smallArtwork: Bool

    var cacheKey: String { "\(quality.rawValue)|\(allowExplicit)|\(smallArtwork)" }
}

extension SaavnAPI {
    struct Hit: Sendable, Identifiable {
        let song: SongFeatures
        let resolved: Resolved
        var id: String { song.id }
    }

    struct TopResult: Sendable {
        enum Kind: String, Sendable { case song, album, artist, playlist }

        let kind: Kind
        let id: String
        let name: String
        let subtitle: String?
        let image: URL?
    }

    struct SearchOverview: Sendable {
        let top: TopResult?
        let results: SearchResults
    }

    struct SearchPage<Item: Sendable>: Sendable {
        let items: [Item]
        let total: Int
    }

    struct Album: Sendable, Identifiable {
        let id: String
        let name: String
        let subtitle: String?
        let image: URL?
        let songs: [Hit]
    }

    struct Playlist: Sendable, Identifiable {
        let id: String
        let name: String
        let subtitle: String?
        let image: URL?
        let songs: [Hit]
    }

    struct Artist: Sendable, Identifiable {
        let id: String
        let name: String
        let image: URL?

        let roles: [String]
        let songs: [Hit]
        let albums: [Album]
    }

    struct Chart: Sendable, Identifiable {
        let id: String
        let name: String
        let image: URL?
        let songCount: Int?
        let songs: [Hit]
    }

    struct SearchResults: Sendable {
        let songs: [Hit]
        let albums: [Album]
        let artists: [Artist]
        let playlists: [Playlist]

        var isEmpty: Bool { songs.isEmpty && albums.isEmpty && artists.isEmpty && playlists.isEmpty }
    }
}
