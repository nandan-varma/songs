import Foundation

public struct QueueItem: Identifiable, Hashable, Sendable {
    public var song: SongFeatures
    public var why: String
    public var id: String { song.id }

    public init(song: SongFeatures, why: String) {
        self.song = song; self.why = why
    }
}
