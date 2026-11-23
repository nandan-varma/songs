import ModesCore

enum SongReference {
    case hit(SaavnAPI.Hit)
    case library(LibraryItem)
    case queued(QueueItem)
}
