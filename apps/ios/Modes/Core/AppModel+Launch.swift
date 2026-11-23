import Foundation
import ModesCore

extension AppModel {
    func loadLaunch(force: Bool = false) async {
        let languages = settings.languages
        guard !languages.isEmpty, force || launch == nil || launchLanguages != languages else { return }
        do {
            launch = try await SaavnAPI.launch(languages: languages, delivery: delivery)
            launchLanguages = languages
            launchFailed = false
            AppLog.info("launch", "shelves \(launch?.shelves.count ?? 0) genres \(launch?.genres.count ?? 0)")
        } catch {
            if launch == nil { launchFailed = true }
            AppLog.error("launch", "could not load launch data: \(error)")
        }
    }

    func stationHits(for tile: SaavnAPI.Tile) async -> [SaavnAPI.Hit] {
        let query = tile.stationKind == "artist" ? (tile.stationQuery ?? tile.name) : tile.name
        let language = tile.language ?? settings.languages.first ?? ""
        do {
            if tile.stationKind == "artist" {
                if let artist = try await SaavnAPI.searchArtists(query, page: 0, delivery: delivery).items.first {
                    let songs = try await SaavnAPI.artist(id: artist.id, delivery: delivery).songs
                    if let seed = songs.first {
                        let similar = (try? await SaavnAPI.suggestions(songID: seed.id, delivery: delivery)) ?? []
                        return Self.merged(songs, similar)
                    }
                    return songs
                }
            } else {
                let playlists = try await SaavnAPI.searchPlaylists("\(query) \(language)", page: 0, delivery: delivery).items
                if let match = playlists.first(where: { !$0.songs.isEmpty }) ?? playlists.first {
                    let songs = try await SaavnAPI.playlist(id: match.id, delivery: delivery).songs
                    if !songs.isEmpty { return songs.shuffled() }
                }
            }
            return try await SaavnAPI.searchSongs("\(query) \(language)", page: 0, delivery: delivery).items.shuffled()
        } catch {
            AppLog.error("radio", "station \(tile.name) failed: \(error)")
            return []
        }
    }

    func playStation(_ tile: SaavnAPI.Tile) async {
        flash("Starting \(tile.name)")
        let hits = await stationHits(for: tile)
        guard let first = hits.first else { flash("\(tile.name) isn’t available right now"); return }
        playSong(.hit(first), in: hits.map { SongReference.hit($0) })
    }

    private static func merged(_ lead: [SaavnAPI.Hit], _ rest: [SaavnAPI.Hit]) -> [SaavnAPI.Hit] {
        var seen = Set(lead.map(\.id))
        return lead + rest.filter { seen.insert($0.id).inserted }
    }

    func syncedLyrics(for item: QueueItem) async -> SaavnAPI.SyncedLyrics? {
        guard settings.labs.syncedLyrics else { return nil }
        if let cached = syncedCache[item.id] { return cached }
        let display = display(item)
        guard let found = try? await SaavnAPI.syncedLyrics(title: display.title, artist: display.compactArtist,
                                                          duration: item.song.duration), !found.lines.isEmpty else { return nil }
        syncedCache[item.id] = found
        return found
    }
}
