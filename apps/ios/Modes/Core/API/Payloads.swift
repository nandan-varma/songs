import Foundation

/// Raw shapes returned by the API (see `src/modules/*/*.schema.ts`); mapped into the value types in `Models.swift`.
/// Only genuinely nullable fields are optional here.
extension SaavnAPI {
    struct LinkPayload: Decodable {
        let quality: String
        let url: String
    }

    struct CreditPayload: Decodable {
        let id: String?
        let name: String?
        let role: String?
        let image: [LinkPayload]?
    }

    struct ArtistsPayload: Decodable {
        let primary: [CreditPayload]?
        let featured: [CreditPayload]?
        let all: [CreditPayload]?
    }

    struct AlbumRefPayload: Decodable {
        let id: String?
        let name: String?
        let url: String?
    }

    struct SongPayload: Decodable {
        let id: String
        let name: String?
        let year: String?
        let releaseDate: String?
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
        let year: Int?
        let songCount: Int?
        let image: [LinkPayload]?
        let artists: ArtistsPayload?
        let songs: [SongPayload]?
    }

    struct PlaylistPayload: Decodable {
        let id: String
        let name: String?
        let description: String?
        let songCount: Int?
        let image: [LinkPayload]?
        let artists: [CreditPayload]?
        let songs: [SongPayload]?
    }

    struct ArtistPayload: Decodable {
        let id: String?
        let name: String
        let role: String?
        let type: String?
        let dominantType: String?
        let image: [LinkPayload]?
        let followerCount: Int?
        let topSongs: [SongPayload]?
        let topAlbums: [AlbumPayload]?
    }

    struct ChartPayload: Decodable {
        let id: String
        let name: String
        let songCount: Int?
        let image: [LinkPayload]?
    }

    struct Envelope<T: Decodable>: Decodable {
        let data: T?
    }

    struct ResultsPayload<T: Decodable>: Decodable {
        let results: [T]?
    }

    struct ArtistSongsPayload: Decodable {
        let songs: [SongPayload]?
    }

    struct ArtistAlbumsPayload: Decodable {
        let albums: [AlbumPayload]?
    }
}

// MARK: - Mapping

extension SaavnAPI.SongPayload {
    func song(highQuality: Bool) -> SaavnAPI.Song {
        let links = downloadUrl ?? []
        let want = highQuality ? "320kbps" : "160kbps"
        let chosen = links.first { $0.quality == want } ?? links.last
        let artwork = image?.last.flatMap { URL(string: $0.url) }
        return SaavnAPI.Song(
            id: id,
            name: (name ?? "").htmlDecoded,
            year: year,
            releaseDate: releaseDate,
            duration: duration ?? 0,
            language: language,
            label: label,
            playCount: playCount,
            explicitContent: explicitContent ?? false,
            hasLyrics: hasLyrics ?? false,
            albumID: album?.id,
            albumName: album?.name.map(\.htmlDecoded),
            albumURL: album?.url.flatMap { URL(string: $0) },
            primaryArtists: (artists?.primary ?? []).map(\.credit),
            featuredArtists: (artists?.featured ?? []).map(\.credit),
            allArtists: (artists?.all ?? []).map(\.credit),
            image: artwork,
            resolved: chosen.flatMap { link in
                URL(string: link.url).map {
                    Resolved(id: id, url: $0, image: artwork, duration: duration ?? 0)
                }
            }
        )
    }
}

extension SaavnAPI.CreditPayload {
    var credit: SaavnAPI.ArtistCredit {
        SaavnAPI.ArtistCredit(
            id: id ?? "",
            name: (name ?? "").htmlDecoded,
            role: role ?? "",
            image: image?.last.flatMap { URL(string: $0.url) }
        )
    }
}

extension SaavnAPI.AlbumPayload {
    func album(highQuality: Bool) -> SaavnAPI.Album {
        SaavnAPI.Album(
            id: id,
            name: (name ?? "").htmlDecoded,
            subtitle: description?.cleanedSubtitle,
            image: image?.last.flatMap { URL(string: $0.url) },
            artists: credits(from: artists),
            songs: (songs ?? []).map { $0.song(highQuality: highQuality) },
            year: year,
            songCount: songCount
        )
    }
}

extension SaavnAPI.PlaylistPayload {
    /// `songs` overrides the payload's single page when the caller has collected the whole playlist.
    func playlist(highQuality: Bool, songs collected: [SaavnAPI.SongPayload]? = nil) -> SaavnAPI.Playlist {
        SaavnAPI.Playlist(
            id: id,
            name: (name ?? "").htmlDecoded,
            subtitle: description?.cleanedSubtitle,
            image: image?.last.flatMap { URL(string: $0.url) },
            artists: (artists ?? []).map(\.credit),
            songs: (collected ?? songs ?? []).map { $0.song(highQuality: highQuality) },
            songCount: songCount
        )
    }
}

extension SaavnAPI.ArtistPayload {
    func artist(highQuality: Bool) -> SaavnAPI.Artist {
        let labels = [role, dominantType, type].compactMap { $0 }.filter { !$0.isEmpty }
        return SaavnAPI.Artist(
            id: id ?? "",
            name: name.htmlDecoded,
            image: image?.last.flatMap { URL(string: $0.url) },
            roles: Array(Set(labels)).sorted(),
            followerCount: followerCount,
            songs: (topSongs ?? []).map { $0.song(highQuality: highQuality) },
            albums: (topAlbums ?? []).map { $0.album(highQuality: highQuality) }
        )
    }
}

extension SaavnAPI.ChartPayload {
    func chart(highQuality: Bool, songs: [SaavnAPI.Song] = []) -> SaavnAPI.Chart {
        SaavnAPI.Chart(
            id: id,
            name: name.htmlDecoded,
            image: image?.last.flatMap { URL(string: $0.url) },
            songCount: songCount,
            songs: songs
        )
    }
}

private func credits(from artists: SaavnAPI.ArtistsPayload?) -> [SaavnAPI.ArtistCredit] {
    let list = artists?.all ?? artists?.primary ?? []
    return list.map(\.credit)
}

private extension String {
    /// Playlist descriptions arrive padded with long runs of whitespace; empty means "no subtitle".
    var cleanedSubtitle: String? {
        let collapsed = split(whereSeparator: \.isWhitespace).joined(separator: " ")
        return collapsed.isEmpty ? nil : collapsed.htmlDecoded
    }
}
