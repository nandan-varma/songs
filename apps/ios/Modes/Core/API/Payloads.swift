import Foundation
import ModesCore

extension SaavnAPI {
    struct Envelope<T: Decodable>: Decodable { let data: T? }
    struct Page<T: Decodable>: Decodable {
        let total: Int?
        let results: [T]?
    }

    struct LyricsPayload: Decodable { let lyrics: String }

    struct TopPayload: Decodable {
        let type: String?
        let id: String?
        let name: String?
        let subtitle: String?
        let image: [LinkPayload]?
    }

    struct OverviewPayload: Decodable {
        let topResult: TopPayload?
        let songs: [SongPayload]?
        let albums: [AlbumPayload]?
        let artists: [ArtistPayload]?
        let playlists: [PlaylistPayload]?

        init(from decoder: Decoder) throws {
            let container = try decoder.container(keyedBy: CodingKeys.self)
            topResult = try? container.decodeIfPresent(TopPayload.self, forKey: .topResult)
            songs = try container.decodeIfPresent([SongPayload].self, forKey: .songs)
            albums = try container.decodeIfPresent([AlbumPayload].self, forKey: .albums)
            artists = try container.decodeIfPresent([ArtistPayload].self, forKey: .artists)
            playlists = try container.decodeIfPresent([PlaylistPayload].self, forKey: .playlists)
        }

        private enum CodingKeys: String, CodingKey { case topResult, songs, albums, artists, playlists }
    }

    struct LinkPayload: Decodable {
        let quality: String
        let url: String
    }

    struct CreditPayload: Decodable {
        let id: String?
        let name: String?
        let role: String?
    }

    struct ArtistsPayload: Decodable {
        let primary: [CreditPayload]?
        let featured: [CreditPayload]?
        let all: [CreditPayload]?
    }

    struct AlbumRefPayload: Decodable {
        let id: String?
        let name: String?
    }

    struct SongPayload: Decodable {
        let id: String
        let name: String?
        let year: String?
        let duration: Double?
        let language: String?
        let label: String?
        let playCount: Int?
        let explicitContent: Bool?
        let hasLyrics: Bool?
        let album: AlbumRefPayload?
        let artists: ArtistsPayload?
        let image: [LinkPayload]?
        let downloadUrl: [LinkPayload]?
    }

    struct AlbumPayload: Decodable {
        let id: String
        let name: String?
        let description: String?
        let image: [LinkPayload]?
        let songs: [SongPayload]?
    }

    struct PlaylistPayload: Decodable {
        let id: String
        let name: String?
        let description: String?
        let songCount: Int?
        let image: [LinkPayload]?
        let songs: [SongPayload]?
    }

    struct ArtistPayload: Decodable {
        let id: String?
        let name: String
        let role: String?
        let type: String?
        let dominantType: String?
        let image: [LinkPayload]?
        let topSongs: [SongPayload]?
        let topAlbums: [AlbumPayload]?
    }

    struct ChartPayload: Decodable {
        let id: String
        let name: String
        let songCount: Int?
        let image: [LinkPayload]?
    }
}

private extension [SaavnAPI.LinkPayload] {
    func artwork(_ delivery: Delivery) -> URL? {
        let chosen = delivery.smallArtwork ? (first { $0.quality.hasPrefix("150") } ?? first) : last
        return chosen.flatMap { URL(string: $0.url) }
    }
}

extension SaavnAPI.SongPayload {
    func hit(delivery: Delivery) -> SaavnAPI.Hit? {
        let links = downloadUrl ?? []
        guard delivery.allowExplicit || explicitContent != true else { return nil }
        let rates = links.compactMap { StreamQuality.bitrate(of: $0.quality) }
        guard let rate = StreamQuality.pick(preference: delivery.quality, available: rates),
              let link = links.first(where: { StreamQuality.bitrate(of: $0.quality) == rate }),
              let stream = URL(string: link.url) else { return nil }
        let artwork = image?.artwork(delivery)
        let length = duration ?? 0
        let song = SongFeatures(
            id: id, title: (name ?? "").htmlDecoded, artist: artistLine,
            album: (album?.name ?? "").htmlDecoded, albumID: album?.id,
            label: label ?? "", language: language ?? "", year: Int(year ?? "") ?? 0,
            artistIDs: (artists?.all ?? []).compactMap(\.id), duration: length,
            playCount: playCount ?? 0, explicit: explicitContent ?? false, image: artwork)
        return SaavnAPI.Hit(song: song, resolved: Resolved(id: id, url: stream, image: artwork, duration: length, hasLyrics: hasLyrics ?? false))
    }

    private var artistLine: String {
        let primary = artists?.primary ?? []
        let featured = artists?.featured ?? []
        let credited = primary.isEmpty
            ? (featured.isEmpty ? (artists?.all ?? []).filter { ($0.role ?? "").contains("singer") } : featured)
            : primary
        return credited.prefix(2).map { ($0.name ?? "").htmlDecoded }.joined(separator: ", ")
    }
}

extension SaavnAPI.AlbumPayload {
    func album(delivery: Delivery) -> SaavnAPI.Album {
        SaavnAPI.Album(id: id, name: (name ?? "").htmlDecoded, subtitle: description?.cleanedSubtitle,
                       image: image?.artwork(delivery), songs: (songs ?? []).compactMap { $0.hit(delivery: delivery) })
    }
}

extension SaavnAPI.PlaylistPayload {
    func playlist(delivery: Delivery, songs collected: [SaavnAPI.SongPayload]? = nil) -> SaavnAPI.Playlist {
        SaavnAPI.Playlist(id: id, name: (name ?? "").htmlDecoded, subtitle: description?.cleanedSubtitle,
                          image: image?.artwork(delivery),
                          songs: (collected ?? songs ?? []).compactMap { $0.hit(delivery: delivery) })
    }
}

extension SaavnAPI.ArtistPayload {
    func artist(delivery: Delivery) -> SaavnAPI.Artist {
        let labels = [role, dominantType, type].compactMap { $0 }.filter { !$0.isEmpty }
        return SaavnAPI.Artist(
            id: id ?? "", name: name.htmlDecoded, image: image?.artwork(delivery),
            roles: Array(Set(labels)).sorted(),
            songs: (topSongs ?? []).compactMap { $0.hit(delivery: delivery) },
            albums: (topAlbums ?? []).map { $0.album(delivery: delivery) })
    }
}

extension SaavnAPI.OverviewPayload {
    func overview(delivery: Delivery) -> SaavnAPI.SearchOverview {
        let hits = (songs ?? []).compactMap { $0.hit(delivery: delivery) }
        let results = SaavnAPI.SearchResults(
            songs: hits,
            albums: (albums ?? []).map { $0.album(delivery: delivery) },
            artists: (artists ?? []).map { $0.artist(delivery: delivery) },
            playlists: (playlists ?? []).map { $0.playlist(delivery: delivery) })
        return SaavnAPI.SearchOverview(top: topResult?.card(in: results, delivery: delivery), results: results)
    }
}

extension SaavnAPI.TopPayload {
    func card(in results: SaavnAPI.SearchResults, delivery: Delivery) -> SaavnAPI.TopResult? {
        guard let id, let name, let kind = type.flatMap(SaavnAPI.TopResult.Kind.init(rawValue:)) else { return nil }
        if kind == .song, !results.songs.contains(where: { $0.song.id == id }) { return nil }
        return SaavnAPI.TopResult(kind: kind, id: id, name: name.htmlDecoded, subtitle: subtitle?.htmlDecoded, image: image?.artwork(delivery))
    }
}

extension SaavnAPI.ChartPayload {
    func chart(delivery: Delivery) -> SaavnAPI.Chart {
        SaavnAPI.Chart(id: id, name: name.htmlDecoded, image: image?.artwork(delivery), songCount: songCount, songs: [])
    }
}

extension String {
    var htmlDecoded: String {
        replacingOccurrences(of: "&quot;", with: "\"").replacingOccurrences(of: "&amp;", with: "&")
            .replacingOccurrences(of: "&#039;", with: "'")
            .replacingOccurrences(of: "&lt;", with: "<").replacingOccurrences(of: "&gt;", with: ">")
    }

    fileprivate var cleanedSubtitle: String? {
        let collapsed = split(whereSeparator: \.isWhitespace).joined(separator: " ")
        return collapsed.isEmpty ? nil : collapsed.htmlDecoded
    }
}
