import AVFoundation
import ModesCore
import Observation
import UIKit

/// The one object the UI and the system (lock screen, Siri) talk to. It is split by concern into `AppModel+*.swift`:
/// persistence, audio session, playback, queue, library, ranking and artwork.
@MainActor @Observable
final class AppModel {
    static let explore: Float = 0.05

    var profile = PersonalizedProfile()
    var settings = AppSettings() {
        didSet {
            if settings.highQuality != oldValue.highQuality { resolved.removeAll() }
            if settings.languages != oldValue.languages {
                pool = []        // candidates were fetched for the old languages
                invalidateRanking()
            } else if settings.personalizationPaused != oldValue.personalizationPaused {
                invalidateRanking()
            }
            scheduleSave()
        }
    }

    // MARK: Playback state

    var current: QueueItem?
    var upNext: [QueueItem] = []
    /// Songs already played this session, newest last, so "previous" and swiping back work like a real player.
    var history: [QueueItem] = []
    var currentArt: UIImage? {
        didSet {
            artTint = currentArt?.averageColor
            if let currentArt, current != nil { nowPlaying.setArtwork(currentArt) }
        }
    }
    /// Average colour of the current cover, used to tint the player background like Apple Music does.
    var artTint: UIColor?
    var isPlaying = false
    var progress = 0.0
    var duration = 0.0
    var loading = false
    /// True from the first song until the session is stopped. Keeps the player bar steady while songs change.
    var hasSession = false
    /// Which way the last song change went; the player animates artwork in from the matching side.
    var lastMoveForward = true
    var toast: String?

    // MARK: Library

    /// Favorites and recents; read through `favoriteItems` / `recentItems`.
    var library = LibraryState() {
        didSet { if library.favorites != oldValue.favorites { refreshLiked() } }
    }
    var playlists: [LocalPlaylist] = []
    var favoriteItems: [LibraryItem] { library.favorites }
    var recentItems: [LibraryItem] { library.recents }

    // MARK: For You

    var homeSlate: [QueueItem] = []
    var homeReasons: [String] = []
    var homeReady = false
    /// The last candidate fetch reached no server at all, so an empty slate means "offline", not "nothing to play".
    var homeFailed = false
    var homeVersion = 0
    var charts: [SaavnAPI.Chart] = []
    var modelStats: PersonalizedStats?
    var modelStatsLoading = false

    // MARK: Plumbing (not observed)

    @ObservationIgnored let player = AVPlayer()
    @ObservationIgnored let nowPlaying = NowPlaying()
    @ObservationIgnored let undoStack = UndoStack()
    @ObservationIgnored let ranking = RankingWorker()
    @ObservationIgnored var playback = PlaybackLedger()
    @ObservationIgnored var listenerQueue = ListenerQueue()
    @ObservationIgnored var forward: [QueueItem] = []
    @ObservationIgnored lazy var sleep = SleepTimerController(
        setVolume: { [weak self] v in self?.player.volume = v },
        onFire: { [weak self] in self?.sleepTimerFired() })

    @ObservationIgnored var rankingRevision = 0
    @ObservationIgnored var tasteRevision = 0
    @ObservationIgnored var homeCachedTaste = -1
    @ObservationIgnored var queueTask: Task<Void, Never>?
    @ObservationIgnored var homeTask: Task<Void, Never>?
    @ObservationIgnored var saveTask: Task<Void, Never>?
    @ObservationIgnored var toastTask: Task<Void, Never>?
    @ObservationIgnored var artTask: Task<Void, Never>?
    @ObservationIgnored var persistenceBlocked = false

    @ObservationIgnored var pool: [RankedCandidate] = []
    @ObservationIgnored var poolAt = Date.distantPast
    @ObservationIgnored var resolved: [String: Resolved] = [:]
    @ObservationIgnored var resolvingIDs = Set<String>()
    @ObservationIgnored var unplayable = Set<String>()
    /// Full metadata of every song seen this session, so a thin library entry still ranks and learns like the live one.
    @ObservationIgnored var knownSongs: [String: SongFeatures] = [:]
    @ObservationIgnored var displayCache: [String: SongDisplay] = [:]

    @ObservationIgnored var failures = 0                  // consecutive songs with no audio
    @ObservationIgnored var streamFailures = 0            // consecutive songs that broke before really playing
    @ObservationIgnored var sessionActive = false
    /// The song on screen was already accounted for when playback gave up, so Play continues with the queue instead.
    @ObservationIgnored var resumeFromQueue = false
    @ObservationIgnored var endToken: NSObjectProtocol?
    @ObservationIgnored var failToken: NSObjectProtocol?
    @ObservationIgnored var stallToken: NSObjectProtocol?
    @ObservationIgnored var statusObservation: NSKeyValueObservation?

    var onboarded: Bool { !settings.languages.isEmpty }
    var learningGate: LearningGate { LearningGate(paused: settings.personalizationPaused) }
    var undoAvailable: Bool { undoStack.isAvailable }
    var undoLabel: String? { undoStack.label }
    var sleepTimer: SleepTimer { sleep.kind }
    var sleepDeadline: Date? { sleep.deadline }

    init() {
        loadState()
        reconcileLikes()
        AppLog.info("launch", "profile dim \(SparseLearner.dimension), observations \(profile.learner.observations), "
            + "languages \(settings.languages), favorites \(library.favorites.count), paused \(settings.personalizationPaused)")
        configureSession()
        player.automaticallyWaitsToMinimizeStalling = true
        player.addPeriodicTimeObserver(forInterval: CMTime(seconds: 0.5, preferredTimescale: 600), queue: .main) { [weak self] time in
            MainActor.assumeIsolated { self?.tick(time) }
        }
        observeSystem()
        nowPlaying.install(.init(
            play: { [weak self] in self?.setPlaying(true) },
            pause: { [weak self] in self?.setPlaying(false) },
            toggle: { [weak self] in self?.togglePlay() },
            next: { [weak self] in self?.skip() },
            previous: { [weak self] in self?.previous() },
            seek: { [weak self] t in self?.seek(toSeconds: t) },
            like: { [weak self] in self?.feedback(.favorite) },
            dislike: { [weak self] in self?.feedback(.suggestLess) }))
    }

    /// Progress ticks twice a second; also notices duration and play state changes the player made by itself.
    private func tick(_ time: CMTime) {
        progress = max(0, time.seconds)
        if duration <= 0, let d = player.currentItem?.duration.seconds, d.isFinite, d > 0 {
            duration = d; syncNowPlaying()
        }
        // Audio is only "heard" once the player really plays, not while it is still buffering.
        if player.timeControlStatus == .playing, player.currentItem != nil, !playback.closed { playback.markStarted() }
        let playing = player.timeControlStatus != .paused
        if playing != isPlaying, player.currentItem != nil { isPlaying = playing; syncNowPlaying() }
    }
}
