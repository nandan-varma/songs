import Foundation
import ModesCore

extension SaavnAPI {
    struct Tile: Sendable, Identifiable, Hashable {
        enum Kind: String, Sendable { case playlist, album, artist, song, radioStation = "radio_station", channel }

        let id: String
        let kind: Kind
        let name: String
        let subtitle: String?
        let image: URL?
        let language: String?
        let color: String?
        let stationKind: String?
        let stationQuery: String?

        var route: MusicRoute? {
            switch kind {
            case .playlist: .playlist(id)
            case .album: .album(id)
            case .artist: .artist(id)
            case .radioStation, .channel, .song: nil
            }
        }
    }

    struct Shelf: Sendable, Identifiable {
        let key: String
        let title: String
        let subtitle: String?
        let items: [Tile]
        var id: String { key }
    }

    struct Launch: Sendable {
        let shelves: [Shelf]
        let genres: [Tile]

        func shelf(_ key: String) -> Shelf? { shelves.first { $0.key == key } }
    }

    struct SyncedLine: Sendable, Hashable {
        let time: Double
        let text: String
    }

    struct SyncedLyrics: Sendable {
        let lines: [SyncedLine]
        let plain: String?
    }

    struct TilePayload: Decodable {
        let id: String
        let type: String
        let name: String
        let subtitle: String?
        let image: [LinkPayload]?
        let language: String?
        let color: String?
        let stationKind: String?
        let stationQuery: String?
    }

    struct ShelfPayload: Decodable {
        let key: String
        let title: String
        let subtitle: String?
        let items: [TilePayload]
    }

    struct LaunchPayload: Decodable {
        let shelves: [ShelfPayload]
        let genres: [TilePayload]
    }

    struct SyncedPayload: Decodable {
        struct Line: Decodable { let time: Double; let text: String }
        let synced: [Line]?
        let plain: String?
    }

    static func launch(languages: [String], delivery: Delivery) async throws -> Launch {
        let query = [URLQueryItem(name: "languages", value: languages.joined(separator: ","))]
        return try await cachedGet("/api/launch", query, delivery: delivery, ttl: TTL.ephemeral, as: LaunchPayload.self) {
            let payload = try required($0)
            func tile(_ p: TilePayload) -> Tile? {
                guard let kind = Tile.Kind(rawValue: p.type) else { return nil }
                let image = delivery.smallArtwork ? (p.image?.first { $0.quality.hasPrefix("150") } ?? p.image?.first) : p.image?.last
                return Tile(id: p.id, kind: kind, name: p.name, subtitle: p.subtitle, image: image.flatMap { URL(string: $0.url) },
                            language: p.language, color: p.color, stationKind: p.stationKind, stationQuery: p.stationQuery)
            }
            return Launch(shelves: payload.shelves.map { Shelf(key: $0.key, title: $0.title, subtitle: $0.subtitle, items: $0.items.compactMap(tile)) },
                          genres: payload.genres.compactMap(tile))
        }
    }

    static func syncedLyrics(title: String, artist: String, duration: Double) async throws -> SyncedLyrics? {
        var query = [URLQueryItem(name: "title", value: title), URLQueryItem(name: "artist", value: artist)]
        if duration > 0 { query.append(URLQueryItem(name: "duration", value: String(Int(duration.rounded())))) }
        guard let payload: SyncedPayload = try await get("/api/lyrics", query) else { return nil }
        let lines = (payload.synced ?? []).map { SyncedLine(time: $0.time, text: $0.text) }
        guard !lines.isEmpty || payload.plain != nil else { return nil }
        return SyncedLyrics(lines: lines, plain: payload.plain)
    }
}
