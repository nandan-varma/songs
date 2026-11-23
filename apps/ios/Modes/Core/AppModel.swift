import AVFoundation
import MediaPlayer
import ModesCore
import Observation
import UIKit

enum Feedback: String {
    case suggestLess, favorite
    var title: String {
        switch self { case .suggestLess: "Suggest less"; case .favorite: "Favorite" }
    }
}

private struct PersistedV2: Codable {
    var version: Int
    var profile: PersonalizedProfile
    var settings: AppSettings
    var library: LibraryState
    var playlists: [LocalPlaylist] = []

    static let currentVersion = 2

    private enum CodingKeys: String, CodingKey { case version, profile, settings, library, playlists }

    init(version: Int, profile: PersonalizedProfile, settings: AppSettings, library: LibraryState,
         playlists: [LocalPlaylist]) {
        self.version = version; self.profile = profile; self.settings = settings
        self.library = library; self.playlists = playlists
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        version = try container.decode(Int.self, forKey: .version)
        profile = try container.decode(PersonalizedProfile.self, forKey: .profile)
        settings = try container.decode(AppSettings.self, forKey: .settings)
        library = try container.decode(LibraryState.self, forKey: .library)
        playlists = try container.decodeIfPresent([LocalPlaylist].self, forKey: .playlists) ?? []
    }
}

@MainActor @Observable
final class AppModel {
    static let explore: Float = 0.05

    let catalog: Catalog
    var profile: PersonalizedProfile
    var settings = AppSettings() {
        didSet {
            if settings.highQuality != oldValue.highQuality { resolved.removeAll() }
            if settings.languages != oldValue.languages || settings.personalizationPaused != oldValue.personalizationPaused {
                invalidateRanking()
            }
            scheduleSave()
        }
    }

    var current: QueueItem?
    var upNext: [QueueItem] = []
    @ObservationIgnored private var listenerQueue = ListenerQueue()
    var currentArt: UIImage? {
        didSet {
            artTint = currentArt?.averageColor
            if let currentArt, current != nil { nowPlaying.setArtwork(currentArt) }
        }
    }
    /// Average colour of the current cover, used to tint the player background like Apple Music does.
    var artTint: UIColor?
    var resolved: [String: Resolved] = [:]
    var isPlaying = false
    var progress = 0.0
    var duration = 0.0
    var loading = false
    /// True from the first song until the session is stopped. Keeps the player bar steady while songs change.
    var hasSession = false
    var toast: String?
    /// Favorites and recents; read through `favoriteItems` / `recentItems`.
    var library = LibraryState() {
        didSet { if library.favorites != oldValue.favorites { refreshLiked() } }
    }
    var playlists: [LocalPlaylist] = []
    /// Saved songs, newest first.
    var favoriteItems: [LibraryItem] { library.favorites }
    /// Recently played songs, newest first, at most 50.
    var recentItems: [LibraryItem] { library.recents }
    var undoAvailable: Bool { undoStack.isAvailable }
    var undoLabel: String? { undoStack.label }
    var sleepTimer: SleepTimer { sleep.kind }
    var sleepDeadline: Date? { sleep.deadline }
    /// Songs already played this session, newest last, so "previous" and swiping back work like a real player.
    var history: [QueueItem] = []
    @ObservationIgnored private var forward: [QueueItem] = []
    /// Which way the last song change went; the player animates artwork in from the matching side.
    var lastMoveForward = true

    @ObservationIgnored private let player = AVPlayer()
    @ObservationIgnored private var rankingRevision = 0
    @ObservationIgnored private var tasteRevision = 0
    @ObservationIgnored private var homeCachedTaste = -1
    @ObservationIgnored private var queueTask: Task<Void, Never>?
    @ObservationIgnored private var homeTask: Task<Void, Never>?
    private(set) var homeSlate: [QueueItem] = []
    private(set) var homeReasons: [String] = []
    private(set) var modelStats: PersonalizedStats?
    private(set) var charts: [SaavnAPI.Chart] = []
    private(set) var modelStatsLoading = false
    private(set) var homeReady = false
    private(set) var homeVersion = 0
    @ObservationIgnored private var saveTask: Task<Void, Never>?
    @ObservationIgnored private var persistenceBlocked = false
    @ObservationIgnored var toastTask: Task<Void, Never>?
    @ObservationIgnored private var artTask: Task<Void, Never>?
    @ObservationIgnored let ranking: RankingWorker
    @ObservationIgnored private let candidateStore = CandidateStore()
    @ObservationIgnored private var pool: [RankedCandidate] = []
    @ObservationIgnored private var poolAt = Date.distantPast
    @ObservationIgnored var apiSongs: [String: SongFeatures] = [:]
    @ObservationIgnored private var unplayable = Set<String>()
    @ObservationIgnored var displayCache: [String: SongDisplay] = [:]
    @ObservationIgnored private var externalResolved: [String: Resolved] = [:]
    @ObservationIgnored private var inFlightArt = Set<String>()
    @ObservationIgnored private var playback = PlaybackLedger()
    @ObservationIgnored private var failures = 0
    @ObservationIgnored private var endToken: NSObjectProtocol?
    @ObservationIgnored private var failToken: NSObjectProtocol?
    @ObservationIgnored private var stallToken: NSObjectProtocol?
    @ObservationIgnored private var statusObservation: NSKeyValueObservation?
    @ObservationIgnored private var streamFailures = 0       // consecutive songs that broke before really playing
    @ObservationIgnored private var resolvingIDs = Set<String>()
    @ObservationIgnored private let nowPlaying = NowPlaying()
    @ObservationIgnored private var sessionActive = false
    @ObservationIgnored private let undoStack = UndoStack()
    @ObservationIgnored private lazy var sleep = SleepTimerController(
        setVolume: { [weak self] v in self?.player.volume = v },
        onFire: { [weak self] in self?.sleepTimerFired() })

    private static let stateURL: URL = {
        let directory = URL.applicationSupportDirectory
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory.appendingPathComponent("listener-v2.plist")
    }()
    static var eventsURL: URL { URL.documentsDirectory.appending(path: "events.jsonl") }
    static let logQueue = DispatchQueue(label: "modes.eventlog", qos: .utility)

    var onboarded: Bool { !settings.languages.isEmpty }

    var learningGate: LearningGate { LearningGate(paused: settings.personalizationPaused) }

    func invalidateRanking() {
        noteTasteChange()
        queueTask?.cancel()
        homeTask?.cancel()
    }

    private func noteTasteChange() {
        rankingRevision += 1
        tasteRevision += 1
        homeCachedTaste = -1
        homeVersion += 1
    }

    init(catalog: Catalog) {
        self.catalog = catalog
        profile = PersonalizedProfile()
        ranking = RankingWorker(catalog: catalog)
        AppLog.info("launch", "catalog \(catalog.count) songs, dim \(catalog.dim), attrs \(catalog.attrDim), sig \(catalog.signature.prefix(40))")
        loadState()
        reconcileLikes()
        AppLog.info("launch", "profile dim \(SparseLearner.dimension), observations \(profile.learner.observations), "
            + "languages \(settings.languages), favorites \(library.favorites.count), paused \(settings.personalizationPaused)")
        configureSession()
        player.automaticallyWaitsToMinimizeStalling = true
        player.addPeriodicTimeObserver(forInterval: CMTime(seconds: 0.5, preferredTimescale: 600), queue: .main) { [weak self] t in
            MainActor.assumeIsolated {
                guard let self else { return }
                self.progress = max(0, t.seconds)
                if self.duration <= 0, let d = self.player.currentItem?.duration.seconds, d.isFinite, d > 0 {
                    self.duration = d; self.syncNowPlaying()
                }
                let playing = self.player.timeControlStatus != .paused
                if playing != self.isPlaying, self.player.currentItem != nil { self.isPlaying = playing; self.syncNowPlaying() }
            }
        }
        observeSystem()
        nowPlaying.install(.init(
            play: { [weak self] in self?.setPlaying(true) },
            pause: { [weak self] in self?.setPlaying(false) },
            toggle: { [weak self] in self?.togglePlay() },
            next: { [weak self] in self?.skip() },
            previous: { [weak self] in self?.restartOrPrevious() },
            seek: { [weak self] t in self?.seek(toSeconds: t) },
            like: { [weak self] in self?.feedback(.favorite) },
            dislike: { [weak self] in self?.feedback(.suggestLess) }))
    }

    // MARK: Audio session & system events

    private func configureSession() {
        do { try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default) }
        catch { AppLog.error("audio", "setCategory failed: \(error)") }
    }

    private func observeSystem() {
        let nc = NotificationCenter.default
        // All of these are delivered on the main queue, so assuming main-actor isolation is sound.
        nc.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] note in
            let type = (note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt).flatMap(AVAudioSession.InterruptionType.init)
            let resume = ((note.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt).map(AVAudioSession.InterruptionOptions.init) ?? []).contains(.shouldResume)
            MainActor.assumeIsolated { self?.handleInterruption(type, shouldResume: resume) }
        }
        nc.addObserver(forName: AVAudioSession.routeChangeNotification, object: nil, queue: .main) { [weak self] note in
            let reason = (note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt).flatMap(AVAudioSession.RouteChangeReason.init)
            MainActor.assumeIsolated { self?.handleRouteChange(reason) }
        }
        nc.addObserver(forName: AVAudioSession.mediaServicesWereResetNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated {
                guard let self else { return }
                AppLog.error("audio", "media services were reset")
                self.sessionActive = false; self.configureSession()
            }
        }
        nc.addObserver(forName: UIApplication.willResignActiveNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.saveNow() }      // playback must keep going in the background
        }
    }

    private func handleInterruption(_ type: AVAudioSession.InterruptionType?, shouldResume: Bool) {
        switch type {
        case .began:
            AppLog.info("audio", "interruption began (playing \(isPlaying))")
            sessionActive = false                            // the system deactivated it; activate again before resuming
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
        if reason == .oldDeviceUnavailable, isPlaying { setPlaying(false) }      // headphones unplugged / Bluetooth gone
    }

    /// Something went wrong with the current stream. Moves on through the normal close path, which guards against double-closing.
    private func handleItemFailure(generation g: Int, why: String) {
        guard playback.isCurrent(g), current != nil, !playback.closed else { return }
        AppLog.error("playback", "stream failed #\(g) at \(Int(progress))s: \(why)")
        streamFailures = progress > 5 ? 1 : streamFailures + 1
        if streamFailures >= 3 {
            streamFailures = 0; playback.markFailed(); closeCurrent(.switched)
            player.pause(); player.replaceCurrentItem(with: nil)
            nowPlaying.stop()
            Task { await giveUp(reason: "Playback keeps failing — check your connection") }
        } else {
            advance(.switched)
        }
    }

    private func observeItem(_ item: AVPlayerItem, generation g: Int) {
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
        // A stream that never starts (bad URL, 403) only reports through the item's status, not the notifications above.
        statusObservation = item.observe(\.status, options: [.new]) { [weak self] item, _ in
            guard item.status == .failed else { return }
            let why = item.error?.localizedDescription ?? "unknown"
            Task { @MainActor in self?.handleItemFailure(generation: g, why: "item failed: \(why)") }
        }
    }

    private func removeItemObservers() {
        for t in [endToken, failToken, stallToken] { if let t { NotificationCenter.default.removeObserver(t) } }
        endToken = nil; failToken = nil; stallToken = nil
        statusObservation?.invalidate(); statusObservation = nil
    }

    // MARK: Persistence

    private func loadState() {
        guard FileManager.default.fileExists(atPath: Self.stateURL.path) else { return }
        do {
            let data = try Data(contentsOf: Self.stateURL)
            let state = try PropertyListDecoder().decode(PersistedV2.self, from: data)
            guard state.version == PersistedV2.currentVersion else { throw CocoaError(.fileReadCorruptFile) }
            profile = state.profile
            settings = state.settings
            library = state.library
            playlists = state.playlists
        } catch {
            AppLog.error("persistence", "listener-v2.plist unreadable; keeping a copy and starting fresh: \(error)")
            let backup = Self.stateURL.deletingLastPathComponent().appendingPathComponent("listener-v2.unreadable.plist")
            try? FileManager.default.removeItem(at: backup)
            if (try? FileManager.default.copyItem(at: Self.stateURL, to: backup)) == nil {
                persistenceBlocked = true
            }
        }
    }

    func scheduleSave() {
        saveTask?.cancel()
        saveTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(1.5))
            guard !Task.isCancelled else { return }
            self?.saveNow()
        }
    }

    func saveNow() {
        guard !persistenceBlocked else { return }
        let state = PersistedV2(version: PersistedV2.currentVersion, profile: profile, settings: settings,
                                library: library, playlists: playlists)
        let encoder = PropertyListEncoder(); encoder.outputFormat = .binary
        guard let data = try? encoder.encode(state) else { return }
        do { try data.write(to: Self.stateURL, options: .atomic) }
        catch { AppLog.error("persistence", "could not write listener-v2.plist: \(error)") }
    }


    func finishOnboarding(languages: [String]) {
        settings.languages = languages
        invalidateRanking()
        scheduleSave()
    }

    func resetProfile() {
        profile = PersonalizedProfile()
        for item in library.favorites.reversed() {
            guard let id = item.catalogSongID ?? item.externalSongID else { continue }
            profile.setLiked(id, true)
            guard let index = catalog.indexByID[id] else { continue }
            profile.learn(SongFeatures(catalogItem: catalog.items[index]), signal: .favorite, gate: LearningGate())
        }
        invalidateRanking()
        log("profile_reset")
        scheduleSave()
        if current != nil { Task { await rebuildUpNext() } }
    }

    func feedback(_ f: Feedback) {
        guard let cur = current else { AppLog.info("feedback", "\(f.rawValue) ignored: nothing playing"); return }
        AppLog.info("feedback", "\(f.rawValue) on \(title(cur))")
        let songID = self.songID(cur)
        let item = libraryItem(for: cur)
        let removing = f == .favorite && library.isFavorite(item.id)
        recordUndo(f, removingFavorite: removing, rejected: f == .suggestLess ? cur : nil)
        switch f {
        case .favorite where removing:
            setFavorite(cur, false, heard: false)
            flash("Removed from Favorites"); log("unfavorite", song: songID)
            log("feedback_\(f.rawValue)", song: songID)
            AppLog.info("library", "unfavorite \(item.id)")
            return
        case .favorite:
            setFavorite(cur, true, heard: true)
            AppLog.info("library", "favorite \(item.id)")
            flash("Added to Favorites")
        case .suggestLess:
            // An explicit instruction, so it applies while learning is paused.
            learn(cur, .rejected)
            log("suggest_less", song: songID); flash("You’ll hear less like this")
            advance(.rejected); return
        }
        log("feedback_\(f.rawValue)", song: songID)
        scheduleSave()
    }

    func isFavorite(_ item: QueueItem?) -> Bool {
        guard let item else { return false }
        return library.isFavorite(libraryID(for: item))
    }


    private func recordUndo(_ f: Feedback, removingFavorite: Bool, rejected: QueueItem?) {
        let name = removingFavorite ? "Favorite" : f.title
        undoStack.push(UndoEntry(label: "Undo \(name)", snapshot: PersonalizedSnapshot(profile),
                                 favorites: library.favorites, rejected: rejected))
    }

    /// Reverts the last learning action if it is still within its window.
    func undo() {
        guard let entry = undoStack.take() else { return }
        entry.snapshot.restore(into: &profile)
        library.favorites = entry.favorites
        if let rejected = entry.rejected {
            listenerQueue.prepend(rejected)
            upNext = listenerQueue.combining(upNext, excluding: current?.id)
        }
        invalidateRanking()
        Task { await rebuildUpNext() }
        AppLog.info("undo", entry.label)
        flash("Undone"); scheduleSave()
    }


    // MARK: Shared song-list actions

    func playSong(_ source: SongReference, in context: [SongReference] = []) {
        switch source {
        case .catalog(let index):
            playPrepared(QueueItem(index: index, why: "You picked this"), after: context)
        case .hit(let hit):
            apiSongs[hit.song.id] = SongFeatures(externalSong: hit.song)
            if let index = catalog.indexByID[hit.song.id] {
                resolved[hit.song.id] = hit.resolved
                playPrepared(QueueItem(index: index, why: "You picked this"), after: context)
            } else {
                externalResolved[hit.song.id] = hit.resolved
                playPrepared(QueueItem(index: -1, ext: hit.song, why: "You picked this"), after: context)
            }
        case .queued(let item):
            if item.index >= 0 { playPrepared(item, after: context) }
            else if let song = item.ext, externalResolved[song.id] != nil { playPrepared(item, after: context) }
            else if let song = item.ext { resolveThenPlay(song: song, after: context) }
        case .library(let item):
            if let raw = item.catalogSongID, let index = catalog.indexByID[raw] {
                playPrepared(QueueItem(index: index, why: "You picked this"), after: context)
            } else if let raw = item.externalSongID ?? item.catalogSongID {
                resolveThenPlay(song: ExternalSong(id: raw, title: item.title, artist: item.artist, image: item.imageURL),
                                after: context)
            }
        }
    }

    private func playPrepared(_ item: QueueItem, after context: [SongReference]) {
        if current != nil, playback.closeOnce() { closeCurrent(.switched) }
        undoStack.clear()
        forward.removeAll()
        let after = queueItems(after: item, in: context)
        listenerQueue.replacePins(with: after)
        upNext = after
        log(item.index >= 0 ? "picked" : "picked_external", song: item.index >= 0 ? catalog.items[item.index].id : item.ext?.id)
        Task { await start(item, picked: true) }
    }

    private func queueItems(after item: QueueItem, in context: [SongReference]) -> [QueueItem] {
        guard !context.isEmpty else { return [] }
        var seen = Set([item.id])
        var reached = false
        var out: [QueueItem] = []
        for reference in context {
            guard let candidate = songItem(for: reference) else { continue }
            if candidate.id == item.id { reached = true; continue }
            guard reached, seen.insert(candidate.id).inserted else { continue }
            out.append(candidate)
        }
        return out
    }

    private func resolveThenPlay(song: ExternalSong, after context: [SongReference]) {
        AppLog.info("library", "resolve then play external \(song.id)")
        Task {
            do {
                guard let audio = try await SaavnAPI.resolve(ids: [song.id], baseURL: settings.baseURL,
                                                             highQuality: settings.highQuality)[song.id] else {
                    flash("Can’t play that song right now"); return
                }
                let resolved = ExternalSong(id: song.id, title: song.title, artist: song.artist, image: song.image ?? audio.image)
                externalResolved[resolved.id] = audio
                playPrepared(QueueItem(index: -1, ext: resolved, why: "You picked this"), after: context)
            } catch {
                AppLog.error("network", "resolve failed for \(song.id): \(error)")
                flash("Can’t reach the music server")
            }
        }
    }

    func toggleSongFavorite(_ source: SongReference) {
        guard let item = songItem(for: source) else { return }
        if item.id == current?.id { feedback(.favorite); return }
        let entry = libraryItem(for: item)
        let favorite = !library.isFavorite(entry.id)
        undoStack.push(UndoEntry(label: "Undo Favorite", snapshot: PersonalizedSnapshot(profile),
                                 favorites: library.favorites, rejected: nil))
        if setFavorite(item, favorite, heard: false) {
            flash(favorite ? "Added to Favorites" : "Removed from Favorites")
        }
        AppLog.info("library", "list favorite toggled \(entry.id)")
    }

    /// The one place a favorite changes the library, the model's liked set and its evidence.
    @discardableResult
    private func setFavorite(_ item: QueueItem, _ favorite: Bool, heard: Bool) -> Bool {
        let entry = libraryItem(for: item)
        let song = heard ? features(for: item) : nil
        let changed = FavoriteAction.set(favorite, item: entry, song: song, library: &library,
                                         profile: &profile, gate: learningGate)
        guard changed else { return false }
        noteTasteChange()
        if current != nil { Task { await rebuildUpNext() } }
        scheduleSave()
        return true
    }

    func queueSongNext(_ source: SongReference) { queueSong(source, last: false) }
    func queueSongLast(_ source: SongReference) { queueSong(source, last: true) }

    private func queueSong(_ source: SongReference, last: Bool) {
        guard let item = songItem(for: source) else { return }
        guard current != nil, hasSession else { playSong(source); return }
        let position = last ? nil : listenerQueue.reservePosition(for: item.id)
        if case .hit(let hit) = source {
            apiSongs[hit.song.id] = SongFeatures(externalSong: hit.song)
            if item.index >= 0 { resolved[hit.song.id] = hit.resolved }
            else { externalResolved[hit.song.id] = hit.resolved }
        }
        if let song = item.ext, externalResolved[song.id] == nil {
            let generation = listenerQueue.clearGeneration
            let baseURL = settings.baseURL
            let highQuality = settings.highQuality
            flash(last ? "Adding to play last…" : "Adding to Up next…")
            Task {
                do {
                    guard let audio = try await SaavnAPI.resolve(ids: [song.id], baseURL: baseURL, highQuality: highQuality)[song.id] else {
                        flash("Can’t play that song right now"); return
                    }
                    guard generation == listenerQueue.clearGeneration else { return }
                    externalResolved[song.id] = audio
                    enqueue(item, position: position, last: last)
                } catch {
                    guard generation == listenerQueue.clearGeneration else { return }
                    AppLog.error("network", "queue resolve failed: \(error)")
                    flash("Can’t reach the music server")
                }
            }
        } else { enqueue(item, position: position, last: last) }
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

    func clearRecents() {
        library.clearRecents()
        AppLog.info("library", "cleared recents"); scheduleSave()
    }


    func setSleepTimer(_ t: SleepTimer) { sleep.set(t) }

    private func sleepTimerFired() {
        setPlaying(false)
        flash("Sleep timer ended")
    }

    /// A song played to its end: advance as usual, unless the sleep timer wants playback to stop here.
    private func songEnded() {
        guard sleep.consumeEndOfSong() else { advance(.completed); return }
        guard current != nil, playback.closeOnce() else { return }
        closeCurrent(.completed)
        player.pause(); player.replaceCurrentItem(with: nil)     // play again replays this song; nothing advances
        isPlaying = false; syncNowPlaying()
        flash("Sleep timer ended")
    }

    // MARK: Recommendation

    private func songID(_ item: QueueItem) -> String {
        item.index >= 0 ? catalog.items[item.index].id : (item.ext?.id ?? "")
    }

    func features(for item: QueueItem) -> SongFeatures {
        let id = songID(item)
        if let known = apiSongs[id] { return known }
        if item.index >= 0 { return SongFeatures(catalogItem: catalog.items[item.index]) }
        if let ext = item.ext { return SongFeatures(externalSong: ext) }
        return SongFeatures(id: id, title: title(item), artist: artist(item))
    }

    private func learn(_ item: QueueItem, _ signal: PlaybackSignal) {
        profile.learn(features(for: item), signal: signal, gate: learningGate)
    }

    private func makeCandidates(_ hits: [CandidateHit]) -> [RankedCandidate] {
        hits.compactMap { candidate in
            guard let audio = candidate.song.resolved else { return nil }
            let song = candidate.song.externalSong
            let features = SongFeatures(externalSong: song)
            apiSongs[song.id] = features
            if catalog.indexByID[song.id] != nil { resolved[song.id] = audio }
            else { externalResolved[song.id] = audio }
            return RankedCandidate(song: features, source: candidate.source)
        }
    }

    private func candidates(force: Bool = false) async -> [RankedCandidate] {
        if !force, !pool.isEmpty, Date().timeIntervalSince(poolAt) < 300 { return pool }
        var seeds: [String] = []
        for id in profile.recent.suffix(3).reversed() + profile.liked.suffix(3).reversed() where !seeds.contains(id) {
            seeds.append(id)
        }
        let hits = await candidateStore.hits(languages: settings.languages, seeds: seeds,
                                             baseURL: settings.baseURL, highQuality: settings.highQuality)
        let fallback = await ranking.fallback(languages: settings.languages)
        var merged = makeCandidates(hits) + fallback
        var seen = Set<String>()
        merged = merged.filter { !unplayable.contains($0.song.id) && seen.insert($0.song.id).inserted }
        pool = merged
        poolAt = .now
        AppLog.info("ranking", "candidates \(merged.count) (api \(hits.count), catalog \(fallback.count))")
        return merged
    }

    private func queueItem(_ ranked: RankedSong) -> QueueItem {
        if let index = catalog.indexByID[ranked.song.id] { return QueueItem(index: index, why: ranked.why) }
        return QueueItem(index: -1, ext: ranked.song.externalSong, why: ranked.why)
    }

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

    /// Pull to refresh: fetches fresh candidates and re-ranks For You.
    func refreshHome() async {
        homeCachedTaste = -1
        poolAt = .distantPast
        homeTask?.cancel()
        await loadHomeSlate()
    }

    func loadCharts() async {
        guard charts.isEmpty else { return }
        charts = (try? await SaavnAPI.charts(baseURL: settings.baseURL, highQuality: settings.highQuality)) ?? []
    }

    func loadStats() async {
        modelStatsLoading = true
        let snapshot = profile
        let stats = await ranking.stats(snapshot)
        modelStatsLoading = false
        guard snapshot.learner.observations == profile.learner.observations else { return }
        modelStats = stats
    }

    func rebuildUpNext() async {
        queueTask?.cancel()
        let pinned = listenerQueue.items + listenerQueue.appended
        let candidates = await candidates()
        let excluded = Set(pinned.map(songID) + [current].compactMap { $0.map(songID) })
        let previousArtist = (listenerQueue.items.last ?? current).map { artist($0) } ?? ""
        let options = RankOptions(count: max(0, 6 - pinned.count), excluded: excluded,
                                  languages: Set(settings.languages), previousArtist: previousArtist,
                                  explore: Self.explore)
        let request = PersonalizedRankingRequest(revision: rankingRevision, queueRevision: listenerQueue.revision,
                                                 profile: profile, candidates: candidates, options: options)
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

    private func refill() async {
        let appendedIDs = Set(listenerQueue.appended.map(\.id))
        let auto = upNext.filter { !appendedIDs.contains($0.id) }
        guard auto.count < 5 else { return }
        let candidates = await candidates()
        let excluded = Set(auto.map(songID) + [current].compactMap { $0.map(songID) })
        let previousArtist = (auto.last ?? current).map { artist($0) } ?? ""
        let options = RankOptions(count: 6 - auto.count, excluded: excluded,
                                  languages: Set(settings.languages), previousArtist: previousArtist,
                                  explore: Self.explore)
        let request = PersonalizedRankingRequest(revision: rankingRevision, queueRevision: listenerQueue.revision,
                                                 profile: profile, candidates: candidates, options: options)
        let result = await ranking.rank(request)
        guard result.request.isCurrent(revision: rankingRevision, queueRevision: listenerQueue.revision) else { return }
        let items = result.items.map { queueItem($0) }
        upNext = listenerQueue.combining(auto + items, excluding: current?.id)
        prefetch()
    }
    // MARK: Artwork

    func artURL(_ i: Int) -> URL? {
        let c = catalog.items[i]
        if !c.img.isEmpty { return URL(string: c.img) }
        return resolved[c.id]?.image
    }

    func artURL(_ q: QueueItem) -> URL? { q.index >= 0 ? artURL(q.index) : q.ext?.image }

    /// Fetches artwork URLs for songs the catalog has no image for (older entries), so lists can show covers.
    func ensureArtwork(for indices: [Int]) {
        let ids = indices.filter { catalog.items[$0].img.isEmpty && resolved[catalog.items[$0].id] == nil && !inFlightArt.contains(catalog.items[$0].id) }
            .map { catalog.items[$0].id }
        guard !ids.isEmpty else { return }
        for chunk in stride(from: 0, to: ids.count, by: 20).map({ Array(ids[$0..<min($0 + 20, ids.count)]) }) {
            inFlightArt.formUnion(chunk)
            Task {
                defer { inFlightArt.subtract(chunk) }
                if let got = try? await SaavnAPI.resolve(ids: chunk, baseURL: settings.baseURL, highQuality: settings.highQuality) {
                    for (k, v) in got { resolved[k] = v }
                }
            }
        }
    }

    /// Artwork already in memory for a queue item (used by the popup bar while paging between songs).
    func cachedArt(for q: QueueItem?) -> UIImage? {
        ImagePipeline.shared.cached(q.flatMap { artURL($0) })
    }

    /// Warms the cache for the songs a swipe could land on, so the bar never shows a blank cover mid-gesture.
    func warmArt(for q: QueueItem?) {
        guard let url = q.flatMap({ artURL($0) }) else { return }
        ImagePipeline.shared.prefetch([url])
    }

    private func loadArt(for item: QueueItem) {
        artTask?.cancel()
        let g = playback.generation
        artTask = Task {
            var url = artURL(item)
            if url == nil, item.index >= 0 { url = resolved[catalog.items[item.index].id]?.image }
            guard let url else { return }
            if let hit = ImagePipeline.shared.cached(url) {
                if playback.isCurrent(g) { currentArt = hit }
                return
            }
            if let image = await ImagePipeline.shared.image(for: url), !Task.isCancelled, playback.isCurrent(g) {
                currentArt = image
            }
        }
    }
    // MARK: Playback

    private func prefetch() {
        warmArt(for: upNext.first); warmArt(for: history.last)
        let head = upNext.prefix(3)
        let catalogIDs = head.filter { $0.index >= 0 }.map { catalog.items[$0.index].id }
        let externalIDs = head.filter { $0.index < 0 }.compactMap { $0.ext?.id }
        let ids = (catalogIDs + externalIDs).filter { resolved[$0] == nil && externalResolved[$0] == nil && !resolvingIDs.contains($0) }
        guard !ids.isEmpty else { return }
        resolvingIDs.formUnion(ids)
        Task {
            defer { resolvingIDs.subtract(ids) }
            do {
                let got = try await SaavnAPI.resolve(ids: ids, baseURL: settings.baseURL, highQuality: settings.highQuality)
                for (songID, audio) in got {
                    if catalog.indexByID[songID] != nil { resolved[songID] = audio } else { externalResolved[songID] = audio }
                }
            } catch { AppLog.error("network", "prefetch failed for \(ids.count) songs: \(error)") }
        }
    }

    private func playHead() async {
        if upNext.isEmpty { await rebuildUpNext() }
        guard !upNext.isEmpty else { return }
        await start(upNext.removeFirst())
    }

    private func start(_ item: QueueItem, picked: Bool = false) async {
        listenerQueue.consume(id: item.id)
        let g = playback.begin()
        AppLog.info("playback", "start #\(g) \(title(item)) — \(artist(item)) [\(item.why)]")
        hasSession = true
        removeItemObservers()
        player.pause(); player.replaceCurrentItem(with: nil)         // the old song stops the moment a new one is chosen
        loading = true; current = item; progress = 0; duration = 0; currentArt = nil; isPlaying = false
        loadArt(for: item)
        nowPlaying.begin(.init(title: displayTitle(item), artist: displayArtist(item), album: display(item).context ?? album(item)), duration: 0)
        refreshLiked()

        let r: Resolved?
        do {
            if item.index >= 0 {
                let id = catalog.items[item.index].id
                if let hit = resolved[id] { r = hit } else {
                    AppLog.info("playback", "no prefetched url for \(title(item)); resolving now")
                    let got = try await SaavnAPI.resolve(ids: [id], baseURL: settings.baseURL, highQuality: settings.highQuality)
                    for (k, v) in got { resolved[k] = v }
                    r = got[id]
                    if r == nil { unplayable.insert(id) }
                }
            } else if let song = item.ext {
                if let hit = externalResolved[song.id] { r = hit } else {
                    let got = try await SaavnAPI.resolve(ids: [song.id], baseURL: settings.baseURL, highQuality: settings.highQuality)
                    externalResolved[song.id] = got[song.id]
                    r = got[song.id]
                }
            } else { r = nil }
        } catch {
            AppLog.error("network", "resolve failed for \(title(item)): \(error)")
            guard playback.isCurrent(g) else { return }
            await giveUp(reason: "Can’t reach the music server")      // a network error says nothing about this song
            return
        }
        guard playback.isCurrent(g) else { return }
        guard let r else {
            AppLog.error("playback", "no audio for \(title(item)); failure \(failures + 1)")
            failures += 1; loading = false; playback.markFailed()
            if failures >= 3 { await giveUp(reason: "Couldn’t load songs — check your connection") } else { current = nil; await playHead() }
            return
        }
        failures = 0; playback.markStarted()
        if picked { learn(item, .picked) }
        duration = r.duration
        recordRecent(item, resolved: r)
        AppLog.info("playback", "playing \(title(item)) \(Int(r.duration))s via \(r.url.host ?? "?")")
        activateSession()
        let playerItem = AVPlayerItem(url: r.url)
        observeItem(playerItem, generation: g)
        player.replaceCurrentItem(with: playerItem); player.play()
        isPlaying = true; loading = false
        syncNowPlaying()
        await refill()
        prefetch()          // refill returns early when the queue is already long, so make sure the head is always resolved
    }

    private func recordRecent(_ item: QueueItem, resolved r: Resolved) {
        var entry = libraryItem(for: item)
        if entry.imageURL == nil { entry.imageURL = r.image }
        library.recordPlay(entry)
        scheduleSave()
    }

    private func giveUp(reason: String) async {
        AppLog.error("playback", "giving up: \(reason)")
        loading = false; isPlaying = false; playback.markFailed(); failures = 0
        flash(reason)
    }

    private func activateSession() {
        guard !sessionActive else { return }
        do { try AVAudioSession.sharedInstance().setActive(true); sessionActive = true; AppLog.info("audio", "session activated") }
        catch { AppLog.error("audio", "session activation failed: \(error)") }
    }

    func togglePlay() { setPlaying(!isPlaying) }

    private func setPlaying(_ on: Bool) {
        if on {
            if player.currentItem == nil, let cur = current { Task { await start(cur) }; return }   // a failed start can be retried
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
    func restartOrPrevious() { previous() }

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

    enum CloseReason { case completed, skipped, rejected, switched }

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

    private func stopPlayback() {
        listenerQueue.clear()
        sleep.cancel(); undoStack.clear()
        playback.invalidate()
        player.pause(); player.replaceCurrentItem(with: nil)
        removeItemObservers(); nowPlaying.stop()
        isPlaying = false; current = nil; upNext = []; hasSession = false; loading = false; history = []; forward = []
    }

    private func closeCurrent(_ reason: CloseReason) {
        guard let cur = current else { return }
        if reason != .rejected { undoStack.clear() }      // the learner moves on, so an older snapshot would erase this
        let id = songID(cur)
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

    /// Pushes elapsed time and rate to the lock screen. Only call on play, pause, seek and song change; the system extrapolates.
    private func syncNowPlaying() {
        guard current != nil else { return }
        nowPlaying.sync(elapsed: progress, duration: duration, playing: isPlaying)
    }

    private func refreshLiked() { nowPlaying.setLiked(isFavorite(current)) }


    /// Erases library and history, then starts a profile from the chosen languages.
    func resetEverything() {
        stopPlayback()
        library = LibraryState()
        profile = PersonalizedProfile()
        homeSlate = []
        homeReasons = []
        modelStats = nil
        invalidateRanking()
        try? FileManager.default.removeItem(at: Self.eventsURL)
        saveNow()
    }
}
