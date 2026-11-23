import Foundation
import ModesCore
import Observation

/// One undoable learning action: what to put back, and the song to bring back if it was rejected.
struct UndoEntry {
    let label: String
    let snapshot: PersonalizedSnapshot
    let favorites: [LibraryItem]
    let rejected: QueueItem?
}

/// Single-level undo that expires on its own. Holds at most one entry; pushing replaces it.
@MainActor @Observable
final class UndoStack {
    static let window: Duration = .seconds(6)

    /// "Undo Less vocals" while an entry is available, otherwise nil.
    private(set) var label: String?
    var isAvailable: Bool { label != nil }

    @ObservationIgnored private var entry: UndoEntry?
    @ObservationIgnored private var expiry: Task<Void, Never>?
    @ObservationIgnored private var token = 0

    func push(_ new: UndoEntry) {
        token += 1; let mine = token
        entry = new; label = new.label
        expiry?.cancel()
        expiry = Task { [weak self] in
            try? await Task.sleep(for: Self.window)
            guard !Task.isCancelled, let self, self.token == mine else { return }
            self.clear()
        }
    }

    /// Hands out the entry (once) and empties the stack.
    func take() -> UndoEntry? {
        defer { clear() }
        return entry
    }

    func clear() {
        expiry?.cancel(); expiry = nil
        entry = nil; label = nil
    }
}
