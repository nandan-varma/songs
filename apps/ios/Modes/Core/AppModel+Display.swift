import Foundation
import ModesCore

extension AppModel {
    func albumID(_ item: QueueItem) -> String? { features(for: item).albumID }

    func artistID(_ item: QueueItem) -> String? { features(for: item).artistIDs.first }

    /// The title of a song id seen this session or saved as a favorite.
    func displayTitle(forSongID id: String) -> String? {
        if let known = knownSongs[id] { return display(title: known.title, artist: known.artist, album: known.album).title }
        return library.favorites.first { $0.id == id }.map { display(title: $0.title, artist: $0.artist).title }
    }

    /// Clean title, artist line and film/album for any song, cached because rows ask on every render.
    func display(title: String, artist: String, album: String = "") -> SongDisplay {
        let key = title + "\u{1}" + artist + "\u{1}" + album
        if let hit = displayCache[key] { return hit }
        if displayCache.count > 3000 { displayCache.removeAll(keepingCapacity: true) }
        let made = SongDisplay(title: title, artist: artist, album: album)
        displayCache[key] = made
        return made
    }

    func display(_ item: QueueItem) -> SongDisplay {
        display(title: item.song.title, artist: item.song.artist, album: item.song.album)
    }
    func displayTitle(_ item: QueueItem) -> String { display(item).title }
    func displayArtist(_ item: QueueItem) -> String { display(item).artist }
    /// The film or album, when it adds information beyond the title.
    func context(_ item: QueueItem) -> String? { display(item).context }
}
