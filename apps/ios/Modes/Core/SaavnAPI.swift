import Foundation

/// Client for the JioSaavn API in `apps/api`. Songs without a stream are dropped, so every `Hit` is playable.
enum SaavnAPI {
    static let baseURL = "https://saavn-api.nandanvarma.com"

    /// Collections and search results change slowly; trending and charts are refreshed hourly by the API.
    private enum TTL {
        static let collection: TimeInterval = 30 * 60
        static let ephemeral: TimeInterval = 10 * 60
    }

    private static let searchLimit = 25
    private static let playlistPageSize = 100
    private static let playlistPageCap = 5

    // MARK: - Transport

    /// The `data` member of the API's envelope, or `nil` when it is absent.
    private static func get<T: Decodable>(_ path: String, _ query: [URLQueryItem] = []) async throws -> T? {
        guard var components = URLComponents(string: baseURL + path) else { throw URLError(.badURL) }
        if !query.isEmpty { components.queryItems = query }
        guard let url = components.url else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.timeoutInterval = 12
        let (data, response) = try await URLSession.shared.data(for: request)
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(Envelope<T>.self, from: data).data
    }

    /// `get`, mapped, and remembered for `ttl`. The key covers path, query and quality because mapping depends on all three.
    private static func cachedGet<Payload: Decodable, Value: Sendable>(
        _ path: String, _ query: [URLQueryItem] = [], highQuality: Bool, ttl: TimeInterval,
        as payload: Payload.Type, map: (Payload?) throws -> Value
    ) async throws -> Value {
        let key = ([path] + query.map { "\($0.name)=\($0.value ?? "")" } + [highQuality ? "320" : "160"]).joined(separator: "|")
        if let hit = await ResponseCache.shared.value(for: key, as: Value.self) { return hit }
        let value = try map(try await get(path, query) as Payload?)
        await ResponseCache.shared.store(value, for: key, ttl: ttl)
        return value
    }

    private static func required<T>(_ value: T?) throws -> T {
        guard let value else { throw URLError(.resourceUnavailable) }
        return value
    }

    // MARK: - Playback

    /// Stream and artwork for the given songs; ids the API does not know are absent from the result.
    static func resolve(ids: [String], highQuality: Bool) async throws -> [String: Resolved] {
        guard !ids.isEmpty else { return [:] }
        let payloads: [SongPayload]? = try await get("/api/songs", [URLQueryItem(name: "ids", value: ids.joined(separator: ","))])
        var out: [String: Resolved] = [:]
        for hit in (payloads ?? []).compactMap({ $0.hit(highQuality: highQuality) }) { out[hit.song.id] = hit.resolved }
        return out
    }

    // MARK: - Collections

    static func album(id: String, highQuality: Bool) async throws -> Album {
        try await cachedGet("/api/albums", [URLQueryItem(name: "id", value: id)], highQuality: highQuality,
                            ttl: TTL.collection, as: AlbumPayload.self) { try required($0).album(highQuality: highQuality) }
    }

    static func playlist(id: String, highQuality: Bool) async throws -> Playlist {
        let key = "playlist|\(id)|\(highQuality ? "320" : "160")"
        if let hit = await ResponseCache.shared.value(for: key, as: Playlist.self) { return hit }
        var first: PlaylistPayload?
        var songs: [SongPayload] = []
        // The endpoint returns one page at a time; walk pages until the playlist is complete.
        for page in 0..<playlistPageCap {
            let query = [URLQueryItem(name: "id", value: id), URLQueryItem(name: "page", value: String(page)),
                         URLQueryItem(name: "limit", value: String(playlistPageSize))]
            guard let batch: PlaylistPayload = try await get("/api/playlists", query) else { break }
            first = first ?? batch
            let added = batch.songs ?? []
            songs.append(contentsOf: added)
            if added.count < playlistPageSize || songs.count >= (batch.songCount ?? songs.count) { break }
        }
        let playlist = try required(first).playlist(highQuality: highQuality, songs: songs)
        await ResponseCache.shared.store(playlist, for: key, ttl: TTL.collection)
        return playlist
    }

    static func artist(id: String, highQuality: Bool) async throws -> Artist {
        try await cachedGet("/api/artists/\(id)", highQuality: highQuality, ttl: TTL.collection,
                            as: ArtistPayload.self) { try required($0).artist(highQuality: highQuality) }
    }

    static func charts() async throws -> [Chart] {
        try await cachedGet("/api/charts", highQuality: false, ttl: TTL.ephemeral,
                            as: [ChartPayload].self) { ($0 ?? []).map { $0.chart() } }
    }

    /// A chart is a playlist, so its songs come from the playlist endpoint.
    static func chart(id: String, highQuality: Bool) async throws -> Chart {
        guard let entry = try await charts().first(where: { $0.id == id }) else { throw URLError(.resourceUnavailable) }
        let songs = try await playlist(id: id, highQuality: highQuality).songs
        return Chart(id: entry.id, name: entry.name, image: entry.image, songCount: entry.songCount, songs: songs)
    }

    // MARK: - Discovery

    static func trending(language: String, highQuality: Bool) async throws -> [Hit] {
        try await cachedGet("/api/trending", [URLQueryItem(name: "type", value: "song"),
                                              URLQueryItem(name: "language", value: language)],
                            highQuality: highQuality, ttl: TTL.ephemeral, as: [SongPayload].self) {
            ($0 ?? []).compactMap { $0.hit(highQuality: highQuality) }
        }
    }

    static func suggestions(songID: String, limit: Int = 20, highQuality: Bool) async throws -> [Hit] {
        try await cachedGet("/api/songs/\(songID)/suggestions", [URLQueryItem(name: "limit", value: String(limit))],
                            highQuality: highQuality, ttl: TTL.collection, as: [SongPayload].self) {
            ($0 ?? []).compactMap { $0.hit(highQuality: highQuality) }
        }
    }

    // MARK: - Search

    /// The API has one search endpoint per kind; the four run in parallel and merge into one result.
    static func search(_ query: String, highQuality: Bool) async throws -> SearchResults {
        async let songs = search("songs", query, highQuality: highQuality) { (p: SongPayload) in p.hit(highQuality: highQuality) }
        async let albums = search("albums", query, highQuality: highQuality) { (p: AlbumPayload) in p.album(highQuality: highQuality) }
        async let artists = search("artists", query, highQuality: highQuality) { (p: ArtistPayload) in p.artist(highQuality: highQuality) }
        async let playlists = search("playlists", query, highQuality: highQuality) { (p: PlaylistPayload) in p.playlist(highQuality: highQuality) }
        return try await SearchResults(songs: songs, albums: albums, artists: artists, playlists: playlists)
    }

    private static func search<P: Decodable, V: Sendable>(
        _ kind: String, _ query: String, highQuality: Bool, map: @escaping @Sendable (P) -> V?
    ) async throws -> [V] {
        try await cachedGet("/api/search/\(kind)",
                            [URLQueryItem(name: "query", value: query), URLQueryItem(name: "limit", value: String(searchLimit))],
                            highQuality: highQuality, ttl: TTL.collection, as: Results<P>.self) {
            ($0?.results ?? []).compactMap(map)
        }
    }
}
