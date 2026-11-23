import Foundation
import ModesCore

struct Resolved: Sendable {
    let id: String
    let url: URL
    let image: URL?
    let duration: Double
}

extension SaavnAPI {
    struct Hit: Sendable {
        let song: SongFeatures
        let resolved: Resolved
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
