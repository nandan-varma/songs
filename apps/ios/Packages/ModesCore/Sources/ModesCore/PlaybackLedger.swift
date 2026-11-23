import Foundation

public struct PlaybackLedger: Sendable, Equatable {
    public private(set) var generation = 0
    public private(set) var closed = true
    public private(set) var started = false

    public init() {}

    @discardableResult
    public mutating func begin() -> Int {
        generation += 1
        closed = false
        started = false
        return generation
    }

    public mutating func markStarted() { started = true }

    public mutating func markFailed() { closed = true }

    public mutating func invalidate() {
        generation += 1
        closed = true
        started = false
    }

    public func isCurrent(_ value: Int) -> Bool { value == generation }

    @discardableResult
    public mutating func closeOnce() -> Bool {
        guard !closed else { return false }
        closed = true
        return true
    }

    public var wasHeard: Bool { started }
}
