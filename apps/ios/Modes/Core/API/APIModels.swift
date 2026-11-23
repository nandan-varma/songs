import Foundation
import ModesCore

/// The audio stream and artwork the API returned for one song, for the configured quality.
struct Resolved: Sendable {
    let id: String
    let url: URL
    let image: URL?
    let duration: Double
}

extension SaavnAPI {
    /// A playable song: its metadata for the learner and the stream to play. Songs without a stream never become hits.
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
        /// Whatever labels the API gives ("Artist", "music director", …); empty when it gives none.
        let roles: [String]
        let songs: [Hit]
        let albums: [Album]
    }

    /// Charts are playlist-backed: metadata comes from /api/charts, songs from the same playlist.
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
