import ModesCore
import Foundation

enum SaavnAPI {
    struct Hit: Sendable { let song: ExternalSong; let resolved: Resolved }

    /// Collections and search results change slowly; trending and charts are refreshed hourly by the API.
    private enum TTL {
        static let collection: TimeInterval = 30 * 60
        static let ephemeral: TimeInterval = 10 * 60
    }

    private static let searchLimit = 25
    private static let playlistPageSize = 100
    private static let playlistPageCap = 5

    // MARK: - Base

    private static func get<T: Decodable>(path: String, query: [URLQueryItem], baseURL: String) async throws -> T {
        guard var comps = URLComponents(string: baseURL + path) else { throw URLError(.badURL) }
        comps.queryItems = query
        guard let url = comps.url else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.timeoutInterval = 12
        let (data, response) = try await URLSession.shared.data(for: request)
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    private static func cached<T: Sendable>(_ key: String, ttl: TimeInterval,
                                            _ load: () async throws -> T) async throws -> T {
        if let hit = await ResponseCache.shared.value(for: key, as: T.self) { return hit }
        let value = try await load()
        await ResponseCache.shared.store(value, for: key, ttl: ttl)
        return value
    }

    private static func key(_ endpoint: String, _ params: [String], baseURL: String, highQuality: Bool) -> String {
        ([baseURL, endpoint] + params + [highQuality ? "320" : "160"]).joined(separator: "|")
    }

    private static func hit(_ song: Song) -> Hit? {
        guard let resolved = song.resolved else { return nil }
        return Hit(song: song.externalSong, resolved: resolved)
    }

    // MARK: - Playback

    static func resolve(ids: [String], baseURL: String, highQuality: Bool) async throws -> [String: Resolved] {
        guard !ids.isEmpty else { return [:] }
        let envelope: Envelope<[SongPayload]> = try await get(path: "/api/songs",
                                                               query: [URLQueryItem(name: "ids", value: ids.joined(separator: ","))],
                                                               baseURL: baseURL)
        var out: [String: Resolved] = [:]
        for payload in envelope.data ?? [] {
            let song = payload.song(highQuality: highQuality)
            if let resolved = song.resolved { out[song.id] = resolved }
        }
        return out
    }

    // MARK: - Collections

    static func album(id: String, baseURL: String, highQuality: Bool) async throws -> Album {
        try await cached(key("albums", [id], baseURL: baseURL, highQuality: highQuality), ttl: TTL.collection) {
            let envelope: Envelope<AlbumPayload> = try await get(path: "/api/albums",
                                                                  query: [URLQueryItem(name: "id", value: id)],
                                                                  baseURL: baseURL)
            guard let payload = envelope.data else { throw URLError(.resourceUnavailable) }
            return payload.album(highQuality: highQuality)
        }
    }

    static func playlist(id: String, baseURL: String, highQuality: Bool) async throws -> Playlist {
        try await cached(key("playlists", [id], baseURL: baseURL, highQuality: highQuality), ttl: TTL.collection) {
            var payload: PlaylistPayload?
            var songs: [SongPayload] = []
            var page = 0
            // The endpoint returns one page (default 10) at a time; walk pages until the playlist is complete.
            while page < playlistPageCap {
                let query = [URLQueryItem(name: "id", value: id),
                             URLQueryItem(name: "page", value: String(page)),
                             URLQueryItem(name: "limit", value: String(playlistPageSize))]
                let envelope: Envelope<PlaylistPayload> = try await get(path: "/api/playlists", query: query, baseURL: baseURL)
                guard let batch = envelope.data else { break }
                payload = payload ?? batch
                let added = batch.songs ?? []
                songs.append(contentsOf: added)
                if added.count < playlistPageSize || songs.count >= (batch.songCount ?? songs.count) { break }
                page += 1
            }
            guard let payload else { throw URLError(.resourceUnavailable) }
            return payload.playlist(highQuality: highQuality, songs: songs)
        }
    }

    static func artist(id: String, baseURL: String, highQuality: Bool) async throws -> Artist {
        try await cached(key("artists", [id], baseURL: baseURL, highQuality: highQuality), ttl: TTL.collection) {
            let envelope: Envelope<ArtistPayload> = try await get(path: "/api/artists/\(id)",
                                                                   query: [], baseURL: baseURL)
            guard let payload = envelope.data else { throw URLError(.resourceUnavailable) }
            return payload.artist(highQuality: highQuality)
        }
    }

    static func artistSongs(id: String, baseURL: String, highQuality: Bool) async throws -> [Song] {
        try await cached(key("artists/songs", [id], baseURL: baseURL, highQuality: highQuality), ttl: TTL.collection) {
            let envelope: Envelope<ArtistSongsPayload> = try await get(path: "/api/artists/\(id)/songs",
                                                                        query: [], baseURL: baseURL)
            return (envelope.data?.songs ?? []).map { $0.song(highQuality: highQuality) }
        }
    }

    static func artistAlbums(id: String, baseURL: String, highQuality: Bool) async throws -> [Album] {
        try await cached(key("artists/albums", [id], baseURL: baseURL, highQuality: highQuality), ttl: TTL.collection) {
            let envelope: Envelope<ArtistAlbumsPayload> = try await get(path: "/api/artists/\(id)/albums",
                                                                         query: [], baseURL: baseURL)
            return (envelope.data?.albums ?? []).map { $0.album(highQuality: highQuality) }
        }
    }

    static func charts(baseURL: String, highQuality: Bool) async throws -> [Chart] {
        try await cached(key("charts", [], baseURL: baseURL, highQuality: highQuality), ttl: TTL.ephemeral) {
            let envelope: Envelope<[ChartPayload]> = try await get(path: "/api/charts",
                                                                    query: [], baseURL: baseURL)
            return (envelope.data ?? []).map { $0.chart(highQuality: highQuality) }
        }
    }

    /// A chart is a playlist, so its songs come from the playlist endpoint.
    static func chart(id: String, baseURL: String, highQuality: Bool) async throws -> Chart {
        guard let entry = try await charts(baseURL: baseURL, highQuality: highQuality).first(where: { $0.id == id }) else {
            throw URLError(.resourceUnavailable)
        }
        let songs = try await playlist(id: id, baseURL: baseURL, highQuality: highQuality).songs
        return Chart(id: entry.id, name: entry.name, image: entry.image, songCount: entry.songCount, songs: songs)
    }

    // MARK: - Trending

    static func trending(language: String, type: TrendingType, baseURL: String, highQuality: Bool) async throws -> Trending {
        let cacheKey = key("trending", [type.rawValue, language], baseURL: baseURL, highQuality: highQuality)
        let query = [URLQueryItem(name: "type", value: type.rawValue), URLQueryItem(name: "language", value: language)]
        return try await cached(cacheKey, ttl: TTL.ephemeral) {
            switch type {
            case .song:
                let envelope: Envelope<[SongPayload]> = try await get(path: "/api/trending",
                                                                       query: query, baseURL: baseURL)
                return .songs((envelope.data ?? []).map { $0.song(highQuality: highQuality) })
            case .album:
                let envelope: Envelope<[AlbumPayload]> = try await get(path: "/api/trending",
                                                                        query: query, baseURL: baseURL)
                return .albums((envelope.data ?? []).map { $0.album(highQuality: highQuality) })
            case .playlist:
                let envelope: Envelope<[PlaylistPayload]> = try await get(path: "/api/trending",
                                                                           query: query, baseURL: baseURL)
                return .playlists((envelope.data ?? []).map { $0.playlist(highQuality: highQuality) })
            }
        }
    }

    static func trending(language: String, baseURL: String, highQuality: Bool) async throws -> [Hit] {
        guard case let .songs(songs) = try await trending(language: language, type: .song, baseURL: baseURL,
                                                          highQuality: highQuality) else { return [] }
        return songs.compactMap(hit)
    }

    // MARK: - Search

    static func search(_ query: String, baseURL: String, highQuality: Bool) async throws -> [Hit] {
        let songs = try await searchSongs(query: query, baseURL: baseURL, highQuality: highQuality)
        return songs.compactMap(hit)
    }

    /// `/api/search` returns a flat shape with no download links, so the four typed endpoints are merged instead.
    static func searchAll(query: String, baseURL: String, highQuality: Bool) async throws -> SearchResults {
        try await cached(key("search/all", [query], baseURL: baseURL, highQuality: highQuality), ttl: TTL.collection) {
            async let songs = searchSongs(query: query, baseURL: baseURL, highQuality: highQuality)
            async let albums = searchAlbums(query: query, baseURL: baseURL, highQuality: highQuality)
            async let artists = searchArtists(query: query, baseURL: baseURL, highQuality: highQuality)
            async let playlists = searchPlaylists(query: query, baseURL: baseURL, highQuality: highQuality)
            let songsFound = try await songs
            let albumsFound = try await albums
            let artistsFound = try await artists
            let playlistsFound = try await playlists
            return SearchResults(songs: songsFound, albums: albumsFound, artists: artistsFound, playlists: playlistsFound)
        }
    }

    /// Searches one kind; the other collections in the result are empty.
    static func search(type: SearchType, query: String, baseURL: String, highQuality: Bool) async throws -> SearchResults {
        switch type {
        case .song: return SearchResults(songs: try await searchSongs(query: query, baseURL: baseURL, highQuality: highQuality))
        case .album: return SearchResults(albums: try await searchAlbums(query: query, baseURL: baseURL, highQuality: highQuality))
        case .artist: return SearchResults(artists: try await searchArtists(query: query, baseURL: baseURL, highQuality: highQuality))
        case .playlist: return SearchResults(playlists: try await searchPlaylists(query: query, baseURL: baseURL, highQuality: highQuality))
        }
    }

    private static func searchSongs(query: String, baseURL: String, highQuality: Bool) async throws -> [Song] {
        try await cached(key("search/songs", [query], baseURL: baseURL, highQuality: highQuality), ttl: TTL.collection) {
            let envelope: Envelope<ResultsPayload<SongPayload>> = try await get(path: "/api/search/songs",
                                                                               query: searchQuery(query), baseURL: baseURL)
            return (envelope.data?.results ?? []).map { $0.song(highQuality: highQuality) }
        }
    }

    private static func searchAlbums(query: String, baseURL: String, highQuality: Bool) async throws -> [Album] {
        try await cached(key("search/albums", [query], baseURL: baseURL, highQuality: highQuality), ttl: TTL.collection) {
            let envelope: Envelope<ResultsPayload<AlbumPayload>> = try await get(path: "/api/search/albums",
                                                                                query: searchQuery(query), baseURL: baseURL)
            return (envelope.data?.results ?? []).map { $0.album(highQuality: highQuality) }
        }
    }

    private static func searchArtists(query: String, baseURL: String, highQuality: Bool) async throws -> [Artist] {
        try await cached(key("search/artists", [query], baseURL: baseURL, highQuality: highQuality), ttl: TTL.collection) {
            let envelope: Envelope<ResultsPayload<ArtistPayload>> = try await get(path: "/api/search/artists",
                                                                                 query: searchQuery(query), baseURL: baseURL)
            return (envelope.data?.results ?? []).map { $0.artist(highQuality: highQuality) }
        }
    }

    private static func searchPlaylists(query: String, baseURL: String, highQuality: Bool) async throws -> [Playlist] {
        try await cached(key("search/playlists", [query], baseURL: baseURL, highQuality: highQuality), ttl: TTL.collection) {
            let envelope: Envelope<ResultsPayload<PlaylistPayload>> = try await get(path: "/api/search/playlists",
                                                                                   query: searchQuery(query), baseURL: baseURL)
            return (envelope.data?.results ?? []).map { $0.playlist(highQuality: highQuality) }
        }
    }

    private static func searchQuery(_ query: String) -> [URLQueryItem] {
        [URLQueryItem(name: "query", value: query), URLQueryItem(name: "limit", value: String(searchLimit))]
    }

    // MARK: - Song suggestions

    static func suggestions(songID: String, limit: Int = 10, baseURL: String, highQuality: Bool) async throws -> [Hit] {
        try await suggestedSongs(songID: songID, limit: limit, baseURL: baseURL, highQuality: highQuality).compactMap(hit)
    }

    static func suggestedSongs(songID: String, limit: Int = 10, baseURL: String, highQuality: Bool) async throws -> [Song] {
        try await cached(key("songs/suggestions", [songID, String(limit)], baseURL: baseURL, highQuality: highQuality),
                         ttl: TTL.collection) {
            let envelope: Envelope<[SongPayload]> = try await get(path: "/api/songs/\(songID)/suggestions",
                                                                   query: [URLQueryItem(name: "limit", value: String(limit))],
                                                                   baseURL: baseURL)
            return (envelope.data ?? []).map { $0.song(highQuality: highQuality) }
        }
    }
}

extension String {
    var htmlDecoded: String {
        replacingOccurrences(of: "&quot;", with: "\"").replacingOccurrences(of: "&amp;", with: "&").replacingOccurrences(of: "&#039;", with: "'")
            .replacingOccurrences(of: "&lt;", with: "<").replacingOccurrences(of: "&gt;", with: ">")
    }
}
