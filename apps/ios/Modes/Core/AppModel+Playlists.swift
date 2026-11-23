import Foundation
import ModesCore

extension AppModel {
    @discardableResult
    func createPlaylist(named name: String, cover: Int? = nil) -> UUID {
        let title = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let playlist = LocalPlaylist(name: title.isEmpty ? "New Playlist" : title, cover: cover ?? Int.random(in: 0..<PlaylistCover.palettes.count))
        playlists.insert(playlist, at: 0)
        scheduleSave()
        return playlist.id
    }

    func deletePlaylist(_ id: UUID) {
        playlists.removeAll { $0.id == id }
        scheduleSave()
    }

    func renamePlaylist(_ id: UUID, to name: String) {
        guard let index = playlists.firstIndex(where: { $0.id == id }) else { return }
        guard playlists[index].rename(name) else { return }
        scheduleSave()
    }

    func addToPlaylist(_ source: SongReference, playlistID: UUID) {
        guard let index = playlists.firstIndex(where: { $0.id == playlistID }) else { return }
        let entry = libraryItem(for: songItem(for: source))
        guard playlists[index].add(entry) else {
            flash("Already in \(playlists[index].name)")
            return
        }
        flash("Added to \(playlists[index].name)")
        learn(songItem(for: source), .saved)
        noteTasteChange()
        scheduleSave()
    }

    func removeFromPlaylist(_ songID: String, playlistID: UUID) {
        guard let index = playlists.firstIndex(where: { $0.id == playlistID }) else { return }
        guard playlists[index].remove(songID: songID) else { return }
        scheduleSave()
    }

    func rejectSong(_ source: SongReference) {
        let item = songItem(for: source)
        learn(item, .rejected)
        unplayable.insert(item.id)
        upNext.removeAll { $0.id == item.id }
        noteTasteChange()
        scheduleSave()
        flash("You’ll hear less like this")
    }

    func startStation(for source: SongReference) {
        let item = songItem(for: source)
        let name = display(item).compactArtist.split(separator: ",").first.map { String($0).trimmingCharacters(in: .whitespaces) } ?? item.song.artist
        let tile = SaavnAPI.Tile(id: item.id, kind: .radioStation, name: "\(name) Radio", subtitle: nil, image: item.song.image,
                                 language: item.song.language, color: nil, stationKind: "artist", stationQuery: name)
        Task { await playStation(tile) }
    }
}
