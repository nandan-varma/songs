import Foundation
import ModesCore
import Observation

struct UndoEntry {
    let label: String
    let snapshot: PersonalizedSnapshot
    let favorites: [LibraryItem]
    let rejected: QueueItem?
}

@MainActor @Observable
final class UndoStack {
    static let window: Duration = .seconds(6)

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

    func take() -> UndoEntry? {
        defer { clear() }
        return entry
    }

    func clear() {
        expiry?.cancel(); expiry = nil
        entry = nil; label = nil
    }
}
