import Foundation
import ModesCore
import Observation

/// Runs the sleep timer: a repeating task that compares a Date deadline with the clock, so it stays correct when the app
/// is backgrounded or suspended. The decisions themselves live in `SleepTimerLogic`; this type only schedules and applies them.
@MainActor @Observable
final class SleepTimerController {
    private static let tick: Duration = .milliseconds(500)

    private(set) var kind: SleepTimer = .off
    /// Set for `.minutes` only.
    private(set) var deadline: Date?

    @ObservationIgnored private var loop: Task<Void, Never>?
    @ObservationIgnored private let setVolume: @MainActor (Float) -> Void
    @ObservationIgnored private let onFire: @MainActor () -> Void

    /// `setVolume` receives 0…1 while fading and 1 when the timer ends or is cancelled; `onFire` pauses playback.
    init(setVolume: @escaping @MainActor (Float) -> Void, onFire: @escaping @MainActor () -> Void) {
        self.setVolume = setVolume; self.onFire = onFire
    }

    func set(_ timer: SleepTimer, now: Date = Date()) {
        let normalized: SleepTimer
        if case .minutes(let n) = timer, n <= 0 { normalized = .off } else { normalized = timer }
        let wasActive = kind != .off
        cancelLoop()
        kind = normalized
        deadline = normalized.deadline(from: now)
        if wasActive { setVolume(1) }
        switch normalized {
        case .off: if wasActive { AppLog.info("sleep", "timer cancelled") }
        case .endOfSong: AppLog.info("sleep", "timer started: end of song")
        case .minutes(let n):
            AppLog.info("sleep", "timer started: \(n) min")
            startLoop()
        }
    }

    /// Stops everything and restores the volume (used when playback stops).
    func cancel() { if kind != .off { set(.off) } }

    /// Called when a song finishes. True means the timer was waiting for exactly this, and playback should stop here.
    func consumeEndOfSong() -> Bool {
        guard kind == .endOfSong else { return false }
        AppLog.info("sleep", "timer fired: end of song")
        kind = .off
        return true
    }

    private func startLoop() {
        loop = Task { [weak self] in
            while !Task.isCancelled {
                guard let self, let deadline = self.deadline else { return }
                switch SleepTimerLogic.decide(now: Date(), deadline: deadline) {
                case .none: break
                case .fade(let volume): self.setVolume(volume)
                case .fire:
                    AppLog.info("sleep", "timer fired: countdown")
                    self.finishCountdown()
                    return
                }
                try? await Task.sleep(for: Self.tick)
            }
        }
    }

    private func finishCountdown() {
        loop = nil; kind = .off; deadline = nil
        onFire()
        setVolume(1)
    }

    private func cancelLoop() { loop?.cancel(); loop = nil }
}
