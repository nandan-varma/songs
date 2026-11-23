import Foundation
import ModesCore

extension AppModel {
    func playSong(_ source: SongReference, in context: [SongReference] = []) {
        let item = songItem(for: source)
        adopt(source)
        if resolved[item.id] != nil { playPrepared(item, after: context) } else { resolveThenPlay(item, after: context) }
    }

    private func playPrepared(_ item: QueueItem, after context: [SongReference]) {
        if current != nil, playback.closeOnce() { closeCurrent(.switched) }
        undoStack.clear()
        forward.removeAll()
        let after = queueItems(after: item, in: context)
        listenerQueue.replacePins(with: after)
        upNext = after
        log("picked", item: item)
        Task { await start(item, picked: true) }
    }

    private func queueItems(after item: QueueItem, in context: [SongReference]) -> [QueueItem] {
        var seen = Set([item.id])
        var reached = false
        var out: [QueueItem] = []
        for reference in context {
            let candidate = songItem(for: reference)
            if candidate.id == item.id { reached = true; continue }
            guard reached, seen.insert(candidate.id).inserted else { continue }
            out.append(candidate)
        }
        return out
    }

    private func resolveThenPlay(_ item: QueueItem, after context: [SongReference]) {
        AppLog.info("library", "resolve then play \(item.id)")
        Task {
            do {
                guard let audio = try await SaavnAPI.resolve(ids: [item.id], delivery: delivery)[item.id] else {
                    flash("Can’t play that song right now"); return
                }
                var playable = item
                if playable.song.image == nil { playable.song.image = audio.image }
                resolved[item.id] = audio
                playPrepared(playable, after: context)
            } catch {
                AppLog.error("network", "resolve failed for \(item.id): \(error)")
                flash("Can’t reach the music server")
            }
        }
    }

    func queueSongNext(_ source: SongReference) { queueSong(source, last: false) }
    func queueSongLast(_ source: SongReference) { queueSong(source, last: true) }

    private func queueSong(_ source: SongReference, last: Bool) {
        let item = songItem(for: source)
        guard current != nil, hasSession else { playSong(source); return }
        let position = last ? nil : listenerQueue.reservePosition(for: item.id)
        adopt(source)
        guard resolved[item.id] == nil else { enqueue(item, position: position, last: last); return }
        let generation = listenerQueue.clearGeneration
        flash(last ? "Adding to play last…" : "Adding to Up next…")
        Task {
            do {
                guard let audio = try await SaavnAPI.resolve(ids: [item.id], delivery: delivery)[item.id] else {
                    flash("Can’t play that song right now"); return
                }
                guard generation == listenerQueue.clearGeneration else { return }
                resolved[item.id] = audio
                enqueue(item, position: position, last: last)
            } catch {
                guard generation == listenerQueue.clearGeneration else { return }
                AppLog.error("network", "queue resolve failed: \(error)")
                flash("Can’t reach the music server")
            }
        }
    }

    private func enqueue(_ item: QueueItem, position: Int?, last: Bool) {
        var queued = item
        queued.why = "You queued this"
        if last {
            listenerQueue.appendLast(queued)
            upNext.removeAll { $0.id == queued.id }
        } else {
            guard let position, listenerQueue.prepend(queued, position: position) else { return }
        }
        upNext = listenerQueue.combining(upNext, excluding: current?.id)
        prefetch()
        flash(last ? "Added to play last" : "Playing next")
        AppLog.info("queue", "listener queued \(queued.id), last \(last)")
    }

    func prefetch() {
        warmArt(for: upNext.first); warmArt(for: history.last)
        let ids = upNext.prefix(3).map(\.id).filter { resolved[$0] == nil && !resolvingIDs.contains($0) }
        guard !ids.isEmpty else { return }
        resolvingIDs.formUnion(ids)
        Task {
            defer { resolvingIDs.subtract(ids) }
            let delivery = delivery

            await withTaskGroup(of: [String: Resolved].self) { group in
                for id in ids {
                    group.addTask {
                        do { return try await SaavnAPI.resolve(ids: [id], delivery: delivery) }
                        catch { AppLog.error("network", "prefetch failed for \(id): \(error)"); return [:] }
                    }
                }
                for await got in group { resolved.merge(got) { _, new in new } }
            }
        }
    }
}
