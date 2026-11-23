import Foundation

extension SaavnAPI {
    /// An artist credited on a song, album or playlist (and the shape returned by artist search).
    struct ArtistCredit: Sendable {
        let id: String
        let name: String
        let role: String
        let image: URL?
    }

    /// A song plus the audio stream chosen for the configured quality.
    struct Song: Sendable, Identifiable {
        let id: String
        let name: String
        let year: String?
        let releaseDate: String?
        let duration: Double
        let language: String?
        let label: String?
        let playCount: Int?
        let explicitContent: Bool
        let hasLyrics: Bool
        let albumID: String?
        let albumName: String?
        let albumURL: URL?
        let primaryArtists: [ArtistCredit]
        let featuredArtists: [ArtistCredit]
        let allArtists: [ArtistCredit]
        let image: URL?
        let resolved: Resolved?

        /// The "name, name" line the lists show. Some songs credit no primary artist, so fall back to featured credits
        /// and then to credited singers (the API's `all` list also holds lyricists and film cast).
        var artistLine: String {
            let credited = primaryArtists.isEmpty
                ? (featuredArtists.isEmpty ? allArtists.filter { $0.role.contains("singer") } : featuredArtists)
                : primaryArtists
            return credited.prefix(2).map(\.name).joined(separator: ", ")
        }
    }

    struct Album: Sendable, Identifiable {
        let id: String
        let name: String
        let subtitle: String?
        let image: URL?
        let artists: [ArtistCredit]
        let songs: [Song]
        let year: Int?
        let songCount: Int?
    }

    struct Playlist: Sendable, Identifiable {
        let id: String
        let name: String
        let subtitle: String?
        let image: URL?
        let artists: [ArtistCredit]
        let songs: [Song]
        let songCount: Int?
    }

    struct Artist: Sendable, Identifiable {
        let id: String
        let name: String
        let image: URL?
        /// Whatever labels the API gives ("Artist", "music director", …); empty when it gives none.
        let roles: [String]
        let followerCount: Int?
        let songs: [Song]
        let albums: [Album]
    }

    /// Charts are playlist-backed: metadata comes from /api/charts, songs from the same playlist.
    struct Chart: Sendable, Identifiable {
        let id: String
        let name: String
        let image: URL?
        let songCount: Int?
        let songs: [Song]
    }

    struct SearchResults: Sendable {
        let songs: [Song]
        let albums: [Album]
        let artists: [Artist]
        let playlists: [Playlist]

        init(songs: [Song] = [], albums: [Album] = [], artists: [Artist] = [], playlists: [Playlist] = []) {
            self.songs = songs
            self.albums = albums
            self.artists = artists
            self.playlists = playlists
        }
    }

    enum TrendingType: String, Sendable {
        case song, album, playlist
    }

    enum Trending: Sendable {
        case songs([Song])
        case albums([Album])
        case playlists([Playlist])
    }

    enum SearchType: String, Sendable {
        case song = "songs", album = "albums", artist = "artists", playlist = "playlists"
    }
}
