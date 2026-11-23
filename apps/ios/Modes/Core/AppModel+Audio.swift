import AVFoundation
import ModesCore
import UIKit

extension AppModel {
    func configureSession() {
        do { try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default) }
        catch { AppLog.error("audio", "setCategory failed: \(error)") }
    }

    func activateSession() {
        guard !sessionActive else { return }
        do { try AVAudioSession.sharedInstance().setActive(true); sessionActive = true; AppLog.info("audio", "session activated") }
        catch { AppLog.error("audio", "session activation failed: \(error)") }
    }

    func observeSystem() {
        let nc = NotificationCenter.default

        nc.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] note in
            let type = (note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt).flatMap(AVAudioSession.InterruptionType.init)
            let options = (note.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt).map(AVAudioSession.InterruptionOptions.init) ?? []
            MainActor.assumeIsolated { self?.handleInterruption(type, shouldResume: options.contains(.shouldResume)) }
        }
        nc.addObserver(forName: AVAudioSession.routeChangeNotification, object: nil, queue: .main) { [weak self] note in
            let reason = (note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt).flatMap(AVAudioSession.RouteChangeReason.init)
            MainActor.assumeIsolated { self?.handleRouteChange(reason) }
        }
        nc.addObserver(forName: AVAudioSession.mediaServicesWereResetNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated {
                guard let self else { return }
                AppLog.error("audio", "media services were reset")
                self.sessionActive = false
                self.configureSession()
            }
        }
        nc.addObserver(forName: UIApplication.willResignActiveNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.saveNow(); self?.saveListeningNow() }
        }
    }

    private func handleInterruption(_ type: AVAudioSession.InterruptionType?, shouldResume: Bool) {
        switch type {
        case .began:
            AppLog.info("audio", "interruption began (playing \(isPlaying))")
            sessionActive = false
            player.pause(); isPlaying = false; syncNowPlaying()
        case .ended:
            AppLog.info("audio", "interruption ended, shouldResume \(shouldResume)")
            activateSession()
            if shouldResume, current != nil, player.currentItem != nil { setPlaying(true); AppLog.info("audio", "resumed after interruption") }
        default: break
        }
    }

    private func handleRouteChange(_ reason: AVAudioSession.RouteChangeReason?) {
        guard let reason else { return }
        AppLog.info("audio", "route change \(reason.rawValue) → \(AVAudioSession.sharedInstance().currentRoute.outputs.map(\.portType.rawValue))")
        if reason == .oldDeviceUnavailable, isPlaying { setPlaying(false) }
    }

    func observeItem(_ item: AVPlayerItem, generation g: Int) {
        removeItemObservers()
        let nc = NotificationCenter.default
        endToken = nc.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: item, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { if let self, self.playback.isCurrent(g) { self.streamFailures = 0; self.songEnded() } }
        }
        failToken = nc.addObserver(forName: .AVPlayerItemFailedToPlayToEndTime, object: item, queue: .main) { [weak self] note in
            let err = (note.userInfo?[AVPlayerItemFailedToPlayToEndTimeErrorKey] as? Error)?.localizedDescription ?? "unknown"
            MainActor.assumeIsolated { self?.handleItemFailure(generation: g, why: "failed to play to end: \(err)") }
        }
        stallToken = nc.addObserver(forName: .AVPlayerItemPlaybackStalled, object: item, queue: .main) { _ in
            MainActor.assumeIsolated { AppLog.error("audio", "playback stalled #\(g); the player waits and resumes by itself") }
        }

        statusObservation = item.observe(\.status, options: [.new]) { [weak self] item, _ in
            guard item.status == .failed else { return }
            let why = item.error?.localizedDescription ?? "unknown"
            Task { @MainActor in self?.handleItemFailure(generation: g, why: "item failed: \(why)") }
        }
    }

    func removeItemObservers() {
        for token in [endToken, failToken, stallToken] { if let token { NotificationCenter.default.removeObserver(token) } }
        endToken = nil; failToken = nil; stallToken = nil
        statusObservation?.invalidate(); statusObservation = nil
    }

    private func handleItemFailure(generation g: Int, why: String) {
        guard playback.isCurrent(g), current != nil, !playback.closed else { return }
        AppLog.error("playback", "stream failed #\(g) at \(Int(progress))s: \(why)")
        streamFailures = progress > 5 ? 1 : streamFailures + 1
        if streamFailures >= 3 {
            streamFailures = 0; playback.markFailed(); closeCurrent(.switched)
            player.pause(); player.replaceCurrentItem(with: nil)
            nowPlaying.stop()
            giveUp(reason: "Playback keeps failing — check your connection")
        } else {
            advance(.switched)
        }
    }

    func syncNowPlaying() {
        guard current != nil else { return }
        nowPlaying.sync(elapsed: progress, duration: duration, playing: isPlaying)
    }

    func refreshLiked() { nowPlaying.setLiked(isFavorite(current)) }
}
