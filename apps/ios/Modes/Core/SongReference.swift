import ModesCore

/// A row keeps its original source so every action addresses that song, never whichever song is currently playing.
enum SongReference {
    case hit(SaavnAPI.Hit)
    case library(LibraryItem)
    case queued(QueueItem)
}
