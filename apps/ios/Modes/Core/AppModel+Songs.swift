import Foundation
import ModesCore

extension AppModel {
    /// The queue entry for any row, with the best metadata known for it.
    func songItem(for source: SongReference) -> QueueItem {
        switch source {
        case .queued(let item):
            return item
        case .hit(let hit):
            return QueueItem(song: hit.song, why: "You picked this")
        case .library(let entry):
            let song = knownSongs[entry.id] ?? SongFeatures(id: entry.id, title: entry.title, artist: entry.artist, image: entry.imageURL)
            return QueueItem(song: song, why: "You picked this")
        }
    }

    /// Remembers the metadata and stream a live hit already carries, so playing it needs no extra request.
    func adopt(_ source: SongReference) {
        guard case .hit(let hit) = source else { return }
        knownSongs[hit.song.id] = hit.song
        resolved[hit.song.id] = hit.resolved
    }

    func libraryItem(for item: QueueItem) -> LibraryItem {
        LibraryItem(id: item.id, title: item.song.title, artist: item.song.artist, imageURL: artURL(item))
    }

    func isFavorite(_ item: QueueItem?) -> Bool {
        guard let item else { return false }
        return library.isFavorite(item.id)
    }

    /// Everything the model knows about a song: the live metadata when seen this session, else what the queue entry carries.
    func features(for item: QueueItem) -> SongFeatures { knownSongs[item.id] ?? item.song }
}
