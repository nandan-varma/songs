import MediaPlayer
import UIKit

/// Owns everything the system shows outside the app: lock screen, Control Center, headphones, CarPlay.
/// Remote command handlers are registered exactly once and hop to the main actor, because the system may call them on any thread.
@MainActor
final class NowPlaying {
    struct Actions {
        var play: @MainActor () -> Void
        var pause: @MainActor () -> Void
        var toggle: @MainActor () -> Void
        var next: @MainActor () -> Void
        var previous: @MainActor () -> Void
        var seek: @MainActor (Double) -> Void
        var like: @MainActor () -> Void
        var dislike: @MainActor () -> Void
    }

    struct Track {
        var title: String
        var artist: String
        var album: String
    }

    private var installed = false
    private var info: [String: Any] = [:]
    private var artwork: MPMediaItemArtwork?

    /// Registers the remote commands. Calling it again is a no-op, so handlers never stack up.
    func install(_ actions: Actions) {
        guard !installed else { return }
        installed = true
        let rc = MPRemoteCommandCenter.shared()
        let all: [MPRemoteCommand] = [rc.playCommand, rc.pauseCommand, rc.togglePlayPauseCommand, rc.nextTrackCommand, rc.previousTrackCommand,
                                      rc.changePlaybackPositionCommand, rc.likeCommand, rc.dislikeCommand]
        for c in all { c.removeTarget(nil) }

        func bind(_ name: String, _ command: MPRemoteCommand, _ run: @escaping @MainActor () -> Void) {
            _ = command.addTarget { _ in
                Task { @MainActor in AppLog.info("nowplaying", "remote \(name)"); run() }
                return .success
            }
        }
        bind("play", rc.playCommand, actions.play)
        bind("pause", rc.pauseCommand, actions.pause)
        bind("togglePlayPause", rc.togglePlayPauseCommand, actions.toggle)
        bind("next", rc.nextTrackCommand, actions.next)
        bind("previous", rc.previousTrackCommand, actions.previous)
        bind("like", rc.likeCommand, actions.like)
        bind("dislike", rc.dislikeCommand, actions.dislike)

        let seek = actions.seek
        _ = rc.changePlaybackPositionCommand.addTarget { event in
            guard let e = event as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
            let t = e.positionTime
            Task { @MainActor in AppLog.info("nowplaying", "remote seek \(Int(t))s"); seek(t) }
            return .success
        }

        rc.likeCommand.localizedTitle = "Favorite"; rc.likeCommand.localizedShortTitle = "Favorite"
        rc.dislikeCommand.localizedTitle = "Suggest less"; rc.dislikeCommand.localizedShortTitle = "Suggest less"
        rc.skipForwardCommand.isEnabled = false
        rc.skipBackwardCommand.isEnabled = false
        rc.seekForwardCommand.isEnabled = false
        rc.seekBackwardCommand.isEnabled = false
        rc.changePlaybackRateCommand.isEnabled = false
        rc.changeRepeatModeCommand.isEnabled = false
        rc.changeShuffleModeCommand.isEnabled = false
        setActive(false)
    }

    /// A new song: replaces the whole info dictionary so the previous cover and timings never linger.
    func begin(_ track: Track, duration: Double) {
        artwork = nil
        info = [
            MPMediaItemPropertyTitle: track.title,
            MPMediaItemPropertyArtist: track.artist,
            MPMediaItemPropertyAlbumTitle: track.album,
            MPMediaItemPropertyPlaybackDuration: duration,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: 0.0,
            MPNowPlayingInfoPropertyPlaybackRate: 0.0,
            MPNowPlayingInfoPropertyDefaultPlaybackRate: 1.0,
            MPNowPlayingInfoPropertyMediaType: MPNowPlayingInfoMediaType.audio.rawValue,
            MPNowPlayingInfoPropertyIsLiveStream: false
        ]
        publish(state: .paused)
        setActive(true)
    }

    /// Call on play, pause, seek and when the duration becomes known. The system extrapolates between calls.
    func sync(elapsed: Double, duration: Double, playing: Bool) {
        guard !info.isEmpty else { return }
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = max(0, elapsed)
        info[MPMediaItemPropertyPlaybackDuration] = duration
        info[MPNowPlayingInfoPropertyPlaybackRate] = playing ? 1.0 : 0.0
        MPRemoteCommandCenter.shared().changePlaybackPositionCommand.isEnabled = duration > 0
        publish(state: playing ? .playing : .paused)
    }

    /// The cover loads after the song starts, so it is attached whenever it arrives.
    func setArtwork(_ image: UIImage?) {
        guard !info.isEmpty else { return }
        if let image {
            let art = Self.makeArtwork(image)
            artwork = art
            info[MPMediaItemPropertyArtwork] = art
        } else {
            artwork = nil
            info[MPMediaItemPropertyArtwork] = nil
        }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    func setLiked(_ liked: Bool) {
        MPRemoteCommandCenter.shared().likeCommand.isActive = liked
    }

    func stop() {
        info = [:]; artwork = nil
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        MPNowPlayingInfoCenter.default().playbackState = .stopped
        setActive(false)
    }

    private func publish(state: MPNowPlayingPlaybackState) {
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
        MPNowPlayingInfoCenter.default().playbackState = state
    }

    private func setActive(_ on: Bool) {
        let rc = MPRemoteCommandCenter.shared()
        rc.playCommand.isEnabled = on
        rc.pauseCommand.isEnabled = on
        rc.togglePlayPauseCommand.isEnabled = on
        rc.nextTrackCommand.isEnabled = on          // there is always another song: the recommender refills the queue
        rc.previousTrackCommand.isEnabled = on      // restarts the song when there is no history
        rc.likeCommand.isEnabled = on
        rc.dislikeCommand.isEnabled = on
        if !on { rc.changePlaybackPositionCommand.isEnabled = false }
    }

    // Built in a nonisolated context: the system calls this handler on a background queue, and a closure that
    // inherits main-actor isolation would trap there.
    nonisolated private static func makeArtwork(_ image: UIImage) -> MPMediaItemArtwork {
        MPMediaItemArtwork(boundsSize: image.size) { _ in image }
    }
}
