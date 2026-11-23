import Foundation

public struct ListenerQueue: Sendable {
    public private(set) var items: [QueueItem] = []

    public private(set) var appended: [QueueItem] = []
    public private(set) var revision = 0

    public private(set) var clearGeneration = 0
    private var nextPosition = 0
    private var positions: [String: Int] = [:]

    public init() {}

    public mutating func reservePosition(for id: String? = nil) -> Int {
        let position = reserve(id)
        revision += 1
        return position
    }

    private mutating func reserve(_ id: String?) -> Int {
        nextPosition += 1
        if let id { positions[id] = nextPosition }
        return nextPosition
    }

    @discardableResult
    public mutating func prepend(_ item: QueueItem, position: Int? = nil) -> Bool {
        let order = position ?? reserve(nil)
        guard order >= positions[item.id, default: 0] else { return false }
        positions[item.id] = order
        items.removeAll { $0.id == item.id }
        items.append(item)
        let priorities = positions
        items.sort { priorities[$0.id, default: 0] > priorities[$1.id, default: 0] }
        revision += 1
        return true
    }

    public mutating func appendLast(_ item: QueueItem) {
        appended.removeAll { $0.id == item.id }
        appended.append(item)
        revision += 1
    }

    public mutating func consume(id: String) {
        items.removeAll { $0.id == id }
        appended.removeAll { $0.id == id }
        revision += 1
    }

    public mutating func clear() {
        items = []
        appended = []
        positions = [:]
        revision += 1
        clearGeneration += 1
    }

    public mutating func replacePins(with newItems: [QueueItem]) {
        items = []
        appended = []
        positions = [:]
        var priority = nextPosition + newItems.count
        nextPosition = priority
        for item in newItems {
            positions[item.id] = priority
            items.append(item)
            priority -= 1
        }
        revision += 1
        clearGeneration += 1
    }

    public func combining(_ recommendations: [QueueItem], excluding currentID: String?) -> [QueueItem] {
        var seen = Set<String>()
        let pinned = items.filter { seen.insert($0.id).inserted }
        if let currentID { seen.insert(currentID) }
        let auto = recommendations.filter { seen.insert($0.id).inserted }
        return pinned + auto + appended.filter { seen.insert($0.id).inserted }
    }
}
