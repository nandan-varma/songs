import Foundation

/// Bounded in-memory cache for collection and search responses. Entries expire on read; errors are never stored.
actor ResponseCache {
    static let shared = ResponseCache()

    private struct Entry {
        let value: Any
        let expiresAt: Date
    }

    private let capacity: Int
    private var entries: [String: Entry] = [:]
    private var insertionOrder: [String] = []

    init(capacity: Int = 200) {
        self.capacity = capacity
    }

    func value<T: Sendable>(for key: String, as type: T.Type) -> T? {
        guard let entry = entries[key] else { return nil }
        guard entry.expiresAt > Date() else {
            remove(key)
            return nil
        }
        return entry.value as? T
    }

    func store<T: Sendable>(_ value: T, for key: String, ttl: TimeInterval) {
        if entries[key] == nil {
            insertionOrder.append(key)
        }
        entries[key] = Entry(value: value, expiresAt: Date().addingTimeInterval(ttl))
        while insertionOrder.count > capacity {
            remove(insertionOrder[0])
        }
    }

    func removeAll() {
        entries.removeAll()
        insertionOrder.removeAll()
    }

    private func remove(_ key: String) {
        entries[key] = nil
        insertionOrder.removeAll { $0 == key }
    }
}
