import Foundation
import ModesCore

extension SaavnAPI.Song {
    var externalSong: ExternalSong {
        ExternalSong(id: id, title: name, artist: artistLine,
                     image: resolved?.image ?? image,
                     album: albumName ?? "", albumID: albumID, label: label ?? "", language: language ?? "",
                     year: Int(year ?? "") ?? 0, artistIDs: allArtists.map(\.id),
                     composer: "", duration: duration, playCount: playCount ?? 0,
                     explicit: explicitContent)
    }

    var hit: SaavnAPI.Hit? {
        guard let resolved else { return nil }
        return SaavnAPI.Hit(song: externalSong, resolved: resolved)
    }
}

/// Bounded live candidate supply; the API client owns the response cache.
actor CandidateStore {
    func hits(languages: [String], seeds: [String], baseURL: String, highQuality: Bool) async -> [CandidateHit] {
        await withTaskGroup(of: [CandidateHit].self) { group in
            for language in languages.prefix(3) {
                group.addTask {
                    let result = try? await SaavnAPI.trending(language: language, type: .song,
                                                              baseURL: baseURL, highQuality: highQuality)
                    guard case .songs(let songs) = result else { return [] }
                    return songs.compactMap { song in
                        song.resolved == nil ? nil : CandidateHit(song: song, source: "trending")
                    }
                }
            }
            for seed in seeds.prefix(3) {
                group.addTask {
                    let songs = (try? await SaavnAPI.suggestedSongs(songID: seed, limit: 20, baseURL: baseURL,
                                                                    highQuality: highQuality)) ?? []
                    return songs.compactMap { song in
                        song.resolved == nil ? nil : CandidateHit(song: song, source: "similar")
                    }
                }
            }
            var output: [CandidateHit] = []
            var seen = Set<String>()
            for await batch in group {
                for candidate in batch where seen.insert(candidate.song.id).inserted {
                    output.append(candidate)
                }
            }
            return output
        }
    }
}
