import Foundation

/// Signals that change the learned profile.
public enum LearningSignal: String, Codable, Sendable, CaseIterable {
    case completion, partialListen, skip, rejection, favorite, manualPick
}

public struct LearningGate: Hashable, Sendable {
    public var paused: Bool

    public init(paused: Bool = false) { self.paused = paused }

    public func allows(_ signal: LearningSignal) -> Bool { !paused }
}
