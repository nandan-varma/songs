import AVFoundation
import ModesCore

extension AppModel {
    enum CloseReason { case completed, skipped, rejected, switched }

    // MARK: Transport

    func togglePlay() { setPlaying(!isPlaying) }

    func setPlaying(_ on: Bool) {
        if on {
            if player.currentItem == nil, let cur = current {      // after giving up there is nothing to resume: retry
                if resumeFromQueue { resumeFromQueue = false; Task { await playHead() } } else { Task { await start(cur) } }
                return
            }
            activateSession()
            player.play()
        } else { player.pause() }
        isPlaying = on
        syncNowPlaying()
    }

    func seek(to fraction: Double) { seek(toSeconds: duration * fraction) }

    func seek(toSeconds seconds: Double) {
        guard duration > 0 else { return }
        let t = min(max(0, seconds), duration)
        player.seek(to: CMTime(seconds: t, preferredTimescale: 600))
        progress = t
        syncNowPlaying()
    }

    /// Like every music app: past the first few seconds it restarts the song, otherwise it goes back one.
    func previous() {
        guard let cur = current else { return }
        if progress > 3 || history.isEmpty { seek(to: 0); return }
        let prev = history.removeLast()
        lastMoveForward = false
        if playback.closeOnce() { closeCurrent(.switched) }
        forward.append(cur)
        if forward.count > 30 { forward.removeFirst() }
        Task { await start(prev) }
    }

    func skip() { advance(.skipped) }

    /// Finishes the current song exactly once, then plays the next one.
    func advance(_ reason: CloseReason) {
        lastMoveForward = true
        guard current != nil, !playback.closed else { AppLog.info("playback", "advance(\(reason)) ignored: already closed"); return }
        AppLog.info("playback", "advance \(reason) at \(Int(progress))s of \(Int(duration))s")
        playback.closeOnce()
        closeCurrent(reason)
        if let next = forward.popLast() {
            Task { await start(next) }
        } else {
            Task { await playHead() }
        }
    }

    // MARK: Starting a song

    func playHead() async {
        if upNext.isEmpty { await rebuildUpNext() }
        guard !upNext.isEmpty else { giveUp(reason: "Can’t reach the music server"); return }
        await start(upNext.removeFirst())
    }

    func start(_ item: QueueItem, picked: Bool = false) async {
        listenerQueue.consume(id: item.id)
        let g = playback.begin()
        resumeFromQueue = false
        AppLog.info("playback", "start #\(g) \(item.song.title) — \(item.song.artist) [\(item.why)]")
        hasSession = true
        removeItemObservers()
        player.pause(); player.replaceCurrentItem(with: nil)         // the old song stops the moment a new one is chosen
        loading = true; current = item; progress = 0; duration = 0; currentArt = nil; isPlaying = false
        loadArt(for: item)
        nowPlaying.begin(.init(title: displayTitle(item), artist: displayArtist(item),
                               album: display(item).context ?? item.song.album), duration: 0)
        refreshLiked()

        let audio: Resolved?
        do {
            if let known = resolved[item.id] { audio = known } else {
                AppLog.info("playback", "no prefetched url for \(item.song.title); resolving now")
                let got = try await SaavnAPI.resolve(ids: [item.id], highQuality: settings.highQuality)
                resolved.merge(got) { _, new in new }
                audio = got[item.id]
                if audio == nil { unplayable.insert(item.id) }
            }
        } catch {
            AppLog.error("network", "resolve failed for \(item.song.title): \(error)")
            guard playback.isCurrent(g) else { return }
            giveUp(reason: "Can’t reach the music server")      // a network error says nothing about this song
            return
        }
        guard playback.isCurrent(g) else { return }
        guard let audio else {
            AppLog.error("playback", "no audio for \(item.song.title); failure \(failures + 1)")
            failures += 1; loading = false; playback.markFailed()
            if failures >= 3 { giveUp(reason: "Couldn’t load songs — check your connection") } else { current = nil; await playHead() }
            return
        }
        failures = 0
        if picked { learn(item, .picked) }
        duration = audio.duration
        recordRecent(item, resolved: audio)
        AppLog.info("playback", "playing \(item.song.title) \(Int(audio.duration))s via \(audio.url.host ?? "?")")
        activateSession()
        let playerItem = AVPlayerItem(url: audio.url)
        observeItem(playerItem, generation: g)
        player.replaceCurrentItem(with: playerItem); player.play()
        isPlaying = true; loading = false
        syncNowPlaying()
        await refill()
        prefetch()          // refill returns early when the queue is already long, so make sure the head is always resolved
    }

    private func recordRecent(_ item: QueueItem, resolved audio: Resolved) {
        var entry = libraryItem(for: item)
        if entry.imageURL == nil { entry.imageURL = audio.image }
        library.recordPlay(entry)
        scheduleSave()
    }

    /// Stops trying and tells the listener why. Tapping play on the current song retries it.
    func giveUp(reason: String) {
        AppLog.error("playback", "giving up: \(reason)")
        resumeFromQueue = playback.closed          // the song was already accounted for; never resume it
        removeItemObservers()
        player.pause(); player.replaceCurrentItem(with: nil)
        loading = false; isPlaying = false; playback.markFailed(); failures = 0
        flash(reason)
    }

    func stopPlayback() {
        listenerQueue.clear()
        sleep.cancel(); undoStack.clear()
        playback.invalidate()
        player.pause(); player.replaceCurrentItem(with: nil)
        removeItemObservers(); nowPlaying.stop()
        isPlaying = false; current = nil; upNext = []; hasSession = false; loading = false; history = []; forward = []
    }

    // MARK: Finishing a song

    /// Accounts for the current song exactly once: learns from what was heard and logs it.
    func closeCurrent(_ reason: CloseReason) {
        guard let cur = current else { return }
        if reason != .rejected { undoStack.clear() }      // the learner moves on, so an older snapshot would erase this
        let id = cur.id
        let frac = duration > 0 ? min(1, progress / duration) : 0
        let heard = playback.wasHeard
        switch reason {
        case .completed:
            learn(cur, .completed)
            log("completed", song: id, frac: 1)
        case .skipped where heard:
            learn(cur, .skipped(fraction: frac, heard: true))
            log("skipped", song: id, frac: frac)
        case .skipped: log("skipped_unheard", song: id)
        case .rejected: break
        case .switched: log("switched_away", song: id, frac: frac)
        }
        if reason == .completed || reason == .skipped { history.append(cur); if history.count > 30 { history.removeFirst() } }
        profile.recent.append(id)
        if profile.recent.count > 600 { profile.recent.removeFirst(200) }
        noteTasteChange()
        scheduleSave()
    }

    func learn(_ item: QueueItem, _ signal: PlaybackSignal) {
        profile.learn(features(for: item), signal: signal, gate: learningGate)
    }

    // MARK: Sleep timer

    func setSleepTimer(_ timer: SleepTimer) { sleep.set(timer) }

    func sleepTimerFired() {
        setPlaying(false)
        flash("Sleep timer ended")
    }

    /// A song played to its end: advance as usual, unless the sleep timer wants playback to stop here.
    func songEnded() {
        guard sleep.consumeEndOfSong() else { advance(.completed); return }
        guard current != nil, playback.closeOnce() else { return }
        closeCurrent(.completed)
        player.pause(); player.replaceCurrentItem(with: nil)     // play again replays this song; nothing advances
        isPlaying = false; syncNowPlaying()
        flash("Sleep timer ended")
    }
}
