import Foundation
import ModesCore

extension AppModel {
    func invalidateRanking() {
        noteTasteChange()
        queueTask?.cancel()
        homeTask?.cancel()
    }

    func noteTasteChange() {
        rankingRevision += 1
        tasteRevision += 1
        homeCachedTaste = -1
        homeVersion += 1
    }

    private func candidates() async -> [RankedCandidate] {
        if !pool.isEmpty, Date().timeIntervalSince(poolAt) < 300 { return pool }
        var seeds: [String] = []
        for id in profile.recent.suffix(3).reversed() + profile.liked.suffix(3).reversed() where !seeds.contains(id) {
            seeds.append(id)
        }
        let batch = await CandidateSource.fetch(languages: settings.languages, seeds: seeds, highQuality: settings.highQuality)
        homeFailed = batch.failed
        var seen = Set<String>()
        let merged = batch.hits.compactMap { candidate -> RankedCandidate? in
            let song = candidate.hit.song
            guard !unplayable.contains(song.id), seen.insert(song.id).inserted else { return nil }
            knownSongs[song.id] = song
            resolved[song.id] = candidate.hit.resolved
            return RankedCandidate(song: song, source: candidate.source)
        }
        pool = merged
        poolAt = batch.failed ? .distantPast : .now
        AppLog.info("ranking", "candidates \(merged.count)\(batch.failed ? " (server unreachable)" : "")")
        return merged
    }

    private func queueItem(_ ranked: RankedSong) -> QueueItem { QueueItem(song: ranked.song, why: ranked.why) }

    func loadHomeSlate() async {
        guard homeCachedTaste != tasteRevision else { return }
        let revision = rankingRevision
        let taste = tasteRevision
        homeTask?.cancel()
        let candidates = await candidates()
        let explore: Float = profile.learner.observations == 0 ? 0 : 0.04
        let options = RankOptions(count: 20, excluded: unplayable, languages: Set(settings.languages), explore: explore)
        let request = PersonalizedRankingRequest(revision: revision, queueRevision: nil, profile: profile,
                                                 candidates: candidates, options: options)
        let task = Task { await ranking.rank(request) }
        homeTask = Task { [weak self] in
            let result = await task.value
            guard !Task.isCancelled else { return }
            guard let self, result.request.revision == self.rankingRevision, self.tasteRevision == taste else { return }
            self.homeCachedTaste = taste
            self.homeSlate = result.items.map { self.queueItem($0) }
            self.homeReasons = result.items.map(\.why)
            AppLog.info("ranking", "home slate \(result.items.count) from \(candidates.count) candidates")
            self.homeReady = true
            for item in self.homeSlate { self.warmArt(for: item) }
        }
        await homeTask?.value
    }

    func refreshHome() async {
        homeCachedTaste = -1
        poolAt = .distantPast
        homeTask?.cancel()
        await loadHomeSlate()
    }

    func loadCharts() async {
        guard charts.isEmpty else { return }
        charts = (try? await SaavnAPI.charts()) ?? []
    }

    func loadStats() async {
        modelStatsLoading = true
        let snapshot = profile
        let stats = await ranking.stats(snapshot)
        modelStatsLoading = false
        guard snapshot.learner.observations == profile.learner.observations else { return }
        modelStats = stats
    }

    private func upNextRequest(count: Int, excluded: Set<String>, previousArtist: String,
                               candidates: [RankedCandidate]) -> PersonalizedRankingRequest {
        let options = RankOptions(count: count, excluded: excluded, languages: Set(settings.languages),
                                  previousArtist: previousArtist, explore: Self.explore)
        return PersonalizedRankingRequest(revision: rankingRevision, queueRevision: listenerQueue.revision,
                                          profile: profile, candidates: candidates, options: options)
    }

    func rebuildUpNext() async {
        queueTask?.cancel()
        let pinned = listenerQueue.items + listenerQueue.appended
        let candidates = await candidates()
        let excluded = Set(pinned.map(\.id) + [current].compactMap { $0?.id })
        let previousArtist = (listenerQueue.items.last ?? current)?.song.artist ?? ""
        let request = upNextRequest(count: max(0, 6 - pinned.count), excluded: excluded,
                                    previousArtist: previousArtist, candidates: candidates)
        let task = Task { await ranking.rank(request) }
        let work = Task { [weak self] in
            let result = await task.value
            guard !Task.isCancelled, let self,
                  result.request.isCurrent(revision: self.rankingRevision,
                                           queueRevision: self.listenerQueue.revision) else { return }
            let items = result.items.map { self.queueItem($0) }
            self.upNext = self.listenerQueue.combining(items, excluding: self.current?.id)
            self.prefetch()
        }
        queueTask = work
        await work.value
    }

    func refill() async {
        let appendedIDs = Set(listenerQueue.appended.map(\.id))
        let auto = upNext.filter { !appendedIDs.contains($0.id) }
        guard auto.count < 5 else { return }
        let candidates = await candidates()
        let excluded = Set(auto.map(\.id) + [current].compactMap { $0?.id })
        let previousArtist = (auto.last ?? current)?.song.artist ?? ""
        let request = upNextRequest(count: 6 - auto.count, excluded: excluded,
                                    previousArtist: previousArtist, candidates: candidates)
        let result = await ranking.rank(request)
        guard result.request.isCurrent(revision: rankingRevision, queueRevision: listenerQueue.revision) else { return }
        upNext = listenerQueue.combining(auto + result.items.map { queueItem($0) }, excluding: current?.id)
        prefetch()
    }
}
