import Foundation

enum SaavnAPI {
    static let baseURL = "https://saavn-api.nandanvarma.com"

    enum TTL {
        static let collection: TimeInterval = 30 * 60
        static let ephemeral: TimeInterval = 10 * 60
    }

    private static let searchLimit = 25
    private static let playlistPageSize = 100
    private static let playlistPageCap = 5

    static func get<T: Decodable>(_ path: String, _ query: [URLQueryItem] = []) async throws -> T? {
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

    static func cachedGet<Payload: Decodable, Value: Sendable>(
        _ path: String, _ query: [URLQueryItem] = [], delivery: Delivery, ttl: TimeInterval,
        as payload: Payload.Type, map: (Payload?) throws -> Value
    ) async throws -> Value {
        let key = ([path] + query.map { "\($0.name)=\($0.value ?? "")" } + [delivery.cacheKey]).joined(separator: "|")
        if let hit = await ResponseCache.shared.value(for: key, as: Value.self) { return hit }
        let value = try map(try await get(path, query) as Payload?)
        await ResponseCache.shared.store(value, for: key, ttl: ttl)
        return value
    }

    static func required<T>(_ value: T?) throws -> T {
        guard let value else { throw URLError(.resourceUnavailable) }
        return value
    }

    static func resolve(ids: [String], delivery: Delivery) async throws -> [String: Resolved] {
        guard !ids.isEmpty else { return [:] }
        let payloads: [SongPayload]? = try await get("/api/songs", [URLQueryItem(name: "ids", value: ids.joined(separator: ","))])
        var out: [String: Resolved] = [:]
        for hit in (payloads ?? []).compactMap({ $0.hit(delivery: delivery) }) { out[hit.song.id] = hit.resolved }
        return out
    }

    static func album(id: String, delivery: Delivery) async throws -> Album {
        try await cachedGet("/api/albums", [URLQueryItem(name: "id", value: id)], delivery: delivery,
                            ttl: TTL.collection, as: AlbumPayload.self) { try required($0).album(delivery: delivery) }
    }

    static func playlist(id: String, delivery: Delivery) async throws -> Playlist {
        let key = "playlist|\(id)|\(delivery.cacheKey)"
        if let hit = await ResponseCache.shared.value(for: key, as: Playlist.self) { return hit }
        var first: PlaylistPayload?
        var songs: [SongPayload] = []

        for page in 0..<playlistPageCap {
            let query = [URLQueryItem(name: "id", value: id), URLQueryItem(name: "page", value: String(page)),
                         URLQueryItem(name: "limit", value: String(playlistPageSize))]
            guard let batch: PlaylistPayload = try await get("/api/playlists", query) else { break }
            first = first ?? batch
            let added = batch.songs ?? []
            songs.append(contentsOf: added)
            if added.count < playlistPageSize || songs.count >= (batch.songCount ?? songs.count) { break }
        }
        let playlist = try required(first).playlist(delivery: delivery, songs: songs)
        await ResponseCache.shared.store(playlist, for: key, ttl: TTL.collection)
        return playlist
    }

    static func artist(id: String, delivery: Delivery) async throws -> Artist {
        try await cachedGet("/api/artists/\(id)", delivery: delivery, ttl: TTL.collection,
                            as: ArtistPayload.self) { try required($0).artist(delivery: delivery) }
    }

    static func charts(delivery: Delivery) async throws -> [Chart] {
        try await cachedGet("/api/charts", delivery: delivery, ttl: TTL.ephemeral,
                            as: [ChartPayload].self) { ($0 ?? []).map { $0.chart(delivery: delivery) } }
    }

    static func chart(id: String, delivery: Delivery) async throws -> Chart {
        guard let entry = try await charts(delivery: delivery).first(where: { $0.id == id }) else { throw URLError(.resourceUnavailable) }
        let songs = try await playlist(id: id, delivery: delivery).songs
        return Chart(id: entry.id, name: entry.name, image: entry.image, songCount: entry.songCount, songs: songs)
    }

    static func trending(language: String, delivery: Delivery) async throws -> [Hit] {
        try await cachedGet("/api/trending/songs", [URLQueryItem(name: "language", value: language)],
                            delivery: delivery, ttl: TTL.ephemeral, as: [SongPayload].self) {
            ($0 ?? []).compactMap { $0.hit(delivery: delivery) }
        }
    }

    static func suggestions(songID: String, limit: Int = 20, delivery: Delivery) async throws -> [Hit] {
        try await cachedGet("/api/songs/\(songID)/suggestions", [URLQueryItem(name: "limit", value: String(limit))],
                            delivery: delivery, ttl: TTL.collection, as: [SongPayload].self) {
            ($0 ?? []).compactMap { $0.hit(delivery: delivery) }
        }
    }

    static let pageSize = 25
    static let overviewLimit = 6

    static func search(_ query: String, delivery: Delivery) async throws -> SearchOverview {
        try await cachedGet("/api/search", [URLQueryItem(name: "query", value: query),
                                            URLQueryItem(name: "limit", value: String(overviewLimit))],
                            delivery: delivery, ttl: TTL.collection, as: OverviewPayload.self) {
            try required($0).overview(delivery: delivery)
        }
    }

    static func searchSongs(_ query: String, page: Int, delivery: Delivery) async throws -> SearchPage<Hit> {
        try await searchPage("songs", query, page: page, delivery: delivery) { (p: SongPayload) in p.hit(delivery: delivery) }
    }

    static func searchAlbums(_ query: String, page: Int, delivery: Delivery) async throws -> SearchPage<Album> {
        try await searchPage("albums", query, page: page, delivery: delivery) { (p: AlbumPayload) in p.album(delivery: delivery) }
    }

    static func searchArtists(_ query: String, page: Int, delivery: Delivery) async throws -> SearchPage<Artist> {
        try await searchPage("artists", query, page: page, delivery: delivery) { (p: ArtistPayload) in p.artist(delivery: delivery) }
    }

    static func searchPlaylists(_ query: String, page: Int, delivery: Delivery) async throws -> SearchPage<Playlist> {
        try await searchPage("playlists", query, page: page, delivery: delivery) { (p: PlaylistPayload) in p.playlist(delivery: delivery) }
    }

    private static func searchPage<P: Decodable, V: Sendable>(
        _ kind: String, _ query: String, page: Int, delivery: Delivery, map: @escaping @Sendable (P) -> V?
    ) async throws -> SearchPage<V> {
        let items = [URLQueryItem(name: "query", value: query), URLQueryItem(name: "page", value: String(page)),
                     URLQueryItem(name: "limit", value: String(pageSize))]
        return try await cachedGet("/api/search/\(kind)", items, delivery: delivery, ttl: TTL.collection,
                                   as: Page<P>.self) {
            SearchPage(items: ($0?.results ?? []).compactMap(map), total: $0?.total ?? 0)
        }
    }

    static func lyrics(songID: String) async throws -> String {
        let payload: LyricsPayload? = try await get("/api/songs/\(songID)/lyrics")
        let text = try required(payload).lyrics
            .replacingOccurrences(of: "<br>", with: "\n").replacingOccurrences(of: "<br/>", with: "\n")
            .replacingOccurrences(of: "<br />", with: "\n")
        return text.htmlDecoded.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
