import Foundation
import ModesCore

extension AppModel {
    func albumID(_ item: QueueItem) -> String? { features(for: item).albumID }

    func artistID(_ item: QueueItem) -> String? { features(for: item).artistIDs.first }

    /// Makes the model's liked ids match the library, repairing state written before list favorites updated both.
    func reconcileLikes() {
        profile.liked = []
        for item in library.favorites.reversed() {
            if let id = item.catalogSongID ?? item.externalSongID { profile.setLiked(id, true) }
        }
    }

    func displayTitle(forSongID id: String) -> String? {
        if let known = apiSongs[id] { return known.title }
        if let index = catalog.indexByID[id] { return display(index: index).title }
        return library.favorites.first { $0.catalogSongID == id || $0.externalSongID == id }?.title
    }

    func title(_ item: QueueItem) -> String { item.index >= 0 ? catalog.items[item.index].title : (item.ext?.title ?? "") }
    func artist(_ item: QueueItem) -> String { item.index >= 0 ? catalog.items[item.index].artist : (item.ext?.artist ?? "") }

    func album(_ item: QueueItem) -> String { item.index >= 0 ? catalog.items[item.index].album : (item.ext?.album ?? "") }

    // MARK: Display text (additive: `title(_:)` and `artist(_:)` still return the raw catalog strings)


    /// Clean title, artist line and film/album for any song, cached because rows ask on every render.
    func display(title: String, artist: String, album: String = "") -> SongDisplay {
        let key = title + "\u{1}" + artist + "\u{1}" + album
        if let hit = displayCache[key] { return hit }
        if displayCache.count > 3000 { displayCache.removeAll(keepingCapacity: true) }
        let made = SongDisplay(title: title, artist: artist, album: album)
        displayCache[key] = made
        return made
    }

    func display(_ item: QueueItem) -> SongDisplay { display(title: title(item), artist: artist(item), album: album(item)) }
    func display(index: Int) -> SongDisplay {
        let catalogItem = catalog.items[index]
        return display(title: catalogItem.title, artist: catalogItem.artist, album: catalogItem.album)
    }
    func displayTitle(_ item: QueueItem) -> String { display(item).title }
    func displayArtist(_ item: QueueItem) -> String { display(item).artist }
    /// The film or album, when it adds information beyond the title.
    func context(_ item: QueueItem) -> String? { display(item).context }

}
