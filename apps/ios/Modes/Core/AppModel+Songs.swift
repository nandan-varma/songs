import Foundation
import ModesCore

extension AppModel {
    func songItem(for source: SongReference) -> QueueItem? {
        switch source {
        case .catalog(let index):
            guard catalog.items.indices.contains(index) else { return nil }
            return QueueItem(index: index, why: "You picked this")
        case .queued(let item): return item
        case .hit(let hit):
            if let index = catalog.indexByID[hit.song.id] { return QueueItem(index: index, why: "You picked this") }
            return QueueItem(index: -1, ext: hit.song, why: "You picked this")
        case .library(let item):
            guard let raw = item.catalogSongID ?? item.externalSongID else { return nil }
            if let index = catalog.indexByID[raw] { return QueueItem(index: index, why: "You picked this") }
            return QueueItem(index: -1, ext: ExternalSong(id: raw, title: item.title, artist: item.artist, image: item.imageURL), why: "You picked this")
        }
    }

    func libraryItem(for item: QueueItem) -> LibraryItem {
        LibraryItem(id: libraryID(for: item), title: title(item), artist: artist(item), imageURL: artURL(item))
    }

    func libraryID(for item: QueueItem) -> String {
        item.index >= 0 ? LibraryItem.catalogID(catalog.items[item.index].id) : LibraryItem.externalID(item.ext?.id ?? "")
    }
}
