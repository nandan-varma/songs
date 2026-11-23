import Foundation
import ModesCore

/// Raw shapes returned by the API, as little of them as the app reads. Only genuinely nullable fields are optional.
/// Each payload maps itself into the value types in `APIModels.swift`.
extension SaavnAPI {
    struct Envelope<T: Decodable>: Decodable { let data: T? }
    struct Results<T: Decodable>: Decodable { let results: [T]? }

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

// MARK: - Mapping

private extension [SaavnAPI.LinkPayload] {
    /// The largest image the API lists.
    var artwork: URL? { last.flatMap { URL(string: $0.url) } }
}

extension SaavnAPI.SongPayload {
    /// `nil` when the API lists no stream for the song, which makes it unplayable.
    func hit(highQuality: Bool) -> SaavnAPI.Hit? {
        let links = downloadUrl ?? []
        let wanted = highQuality ? "320kbps" : "160kbps"
        guard let link = links.first(where: { $0.quality == wanted }) ?? links.last,
              let stream = URL(string: link.url) else { return nil }
        let artwork = image?.artwork
        let length = duration ?? 0
        let song = SongFeatures(
            id: id, title: (name ?? "").htmlDecoded, artist: artistLine,
            album: (album?.name ?? "").htmlDecoded, albumID: album?.id,
            label: label ?? "", language: language ?? "", year: Int(year ?? "") ?? 0,
            artistIDs: (artists?.all ?? []).compactMap(\.id), duration: length,
            playCount: playCount ?? 0, explicit: explicitContent ?? false, image: artwork)
        return SaavnAPI.Hit(song: song, resolved: Resolved(id: id, url: stream, image: artwork, duration: length))
    }

    /// The "name, name" line the lists show. Some songs credit no primary artist, so fall back to featured credits
    /// and then to credited singers (the API's `all` list also holds lyricists and film cast).
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
    func album(highQuality: Bool) -> SaavnAPI.Album {
        SaavnAPI.Album(id: id, name: (name ?? "").htmlDecoded, subtitle: description?.cleanedSubtitle,
                       image: image?.artwork, songs: (songs ?? []).compactMap { $0.hit(highQuality: highQuality) })
    }
}

extension SaavnAPI.PlaylistPayload {
    /// `songs` overrides the payload's single page when the caller has collected the whole playlist.
    func playlist(highQuality: Bool, songs collected: [SaavnAPI.SongPayload]? = nil) -> SaavnAPI.Playlist {
        SaavnAPI.Playlist(id: id, name: (name ?? "").htmlDecoded, subtitle: description?.cleanedSubtitle,
                          image: image?.artwork,
                          songs: (collected ?? songs ?? []).compactMap { $0.hit(highQuality: highQuality) })
    }
}

extension SaavnAPI.ArtistPayload {
    func artist(highQuality: Bool) -> SaavnAPI.Artist {
        let labels = [role, dominantType, type].compactMap { $0 }.filter { !$0.isEmpty }
        return SaavnAPI.Artist(
            id: id ?? "", name: name.htmlDecoded, image: image?.artwork,
            roles: Array(Set(labels)).sorted(),
            songs: (topSongs ?? []).compactMap { $0.hit(highQuality: highQuality) },
            albums: (topAlbums ?? []).map { $0.album(highQuality: highQuality) })
    }
}

extension SaavnAPI.ChartPayload {
    func chart(songs: [SaavnAPI.Hit] = []) -> SaavnAPI.Chart {
        SaavnAPI.Chart(id: id, name: name.htmlDecoded, image: image?.artwork, songCount: songCount, songs: songs)
    }
}

extension String {
    var htmlDecoded: String {
        replacingOccurrences(of: "&quot;", with: "\"").replacingOccurrences(of: "&amp;", with: "&")
            .replacingOccurrences(of: "&#039;", with: "'")
            .replacingOccurrences(of: "&lt;", with: "<").replacingOccurrences(of: "&gt;", with: ">")
    }

    /// Playlist descriptions arrive padded with long runs of whitespace; empty means "no subtitle".
    fileprivate var cleanedSubtitle: String? {
        let collapsed = split(whereSeparator: \.isWhitespace).joined(separator: " ")
        return collapsed.isEmpty ? nil : collapsed.htmlDecoded
    }
}
