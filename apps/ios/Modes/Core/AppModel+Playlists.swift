import Foundation
import ModesCore

extension AppModel {
    @discardableResult
    func createPlaylist(named name: String) -> UUID {
        let title = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let playlist = LocalPlaylist(name: title.isEmpty ? "New Playlist" : title)
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
        scheduleSave()
    }

    func removeFromPlaylist(_ songID: String, playlistID: UUID) {
        guard let index = playlists.firstIndex(where: { $0.id == playlistID }) else { return }
        guard playlists[index].remove(songID: songID) else { return }
        scheduleSave()
    }
}
