import Foundation
import ModesCore
import Observation

@MainActor @Observable
final class SleepTimerController {
    private static let tick: Duration = .milliseconds(500)

    private(set) var kind: SleepTimer = .off

    private(set) var deadline: Date?

    @ObservationIgnored private var loop: Task<Void, Never>?
    @ObservationIgnored private let setVolume: @MainActor (Float) -> Void
    @ObservationIgnored private let onFire: @MainActor () -> Void

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

    func cancel() { if kind != .off { set(.off) } }

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
