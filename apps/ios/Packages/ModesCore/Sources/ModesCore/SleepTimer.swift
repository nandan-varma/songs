import Foundation

public enum SleepTimer: Equatable, Codable, Sendable {
    case off
    case minutes(Int)
    case endOfSong

    public func deadline(from now: Date) -> Date? {
        guard case .minutes(let n) = self, n > 0 else { return nil }
        return now.addingTimeInterval(Double(n) * 60)
    }
}

public enum SleepDecision: Equatable, Sendable {
    case none
    case fade(volume: Float)
    case fire
}

public enum SleepTimerLogic {
    public static let fadeDuration: TimeInterval = 8

    public static func decide(now: Date, deadline: Date, fade: TimeInterval = fadeDuration) -> SleepDecision {
        let remaining = deadline.timeIntervalSince(now)
        if remaining <= 0 { return .fire }
        if remaining >= fade { return .none }
        return .fade(volume: Float(remaining / fade))
    }
}
