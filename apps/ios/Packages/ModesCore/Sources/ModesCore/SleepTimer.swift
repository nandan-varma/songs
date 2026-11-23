import Foundation

/// What the listener asked for: nothing, a countdown, or stopping after the current song.
public enum SleepTimer: Equatable, Codable, Sendable {
    case off
    case minutes(Int)
    case endOfSong

    /// When a countdown timer started at `now` ends; nil for the other kinds and for non-positive durations.
    public func deadline(from now: Date) -> Date? {
        guard case .minutes(let n) = self, n > 0 else { return nil }
        return now.addingTimeInterval(Double(n) * 60)
    }
}

/// What the countdown should do right now.
public enum SleepDecision: Equatable, Sendable {
    case none
    case fade(volume: Float)      // 0…1, linear over the fade window
    case fire                     // pause and reset
}

public enum SleepTimerLogic {
    public static let fadeDuration: TimeInterval = 8

    /// Pure decision for a countdown: nothing until the final `fade` seconds, then a linear fade, then fire at the deadline.
    public static func decide(now: Date, deadline: Date, fade: TimeInterval = fadeDuration) -> SleepDecision {
        let remaining = deadline.timeIntervalSince(now)
        if remaining <= 0 { return .fire }
        if remaining >= fade { return .none }
        return .fade(volume: Float(remaining / fade))
    }
}
