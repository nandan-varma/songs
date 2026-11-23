import AVFoundation
import ModesCore
import Observation
import UIKit

@MainActor @Observable
final class AppModel {
    static let explore: Float = 0.05

    var profile = PersonalizedProfile()
    var settings = AppSettings() {
        didSet {
            if settings.wifiQuality != oldValue.wifiQuality || settings.cellularQuality != oldValue.cellularQuality
                || settings.dataSaver != oldValue.dataSaver || settings.allowExplicit != oldValue.allowExplicit {
                deliveryChanged()
            } else if settings.languages != oldValue.languages {
                pool = []
                invalidateRanking()
            } else if settings.personalizationPaused != oldValue.personalizationPaused {
                invalidateRanking()
            }
            scheduleSave()
        }
    }

    var current: QueueItem?
    var upNext: [QueueItem] = []

    var history: [QueueItem] = []
    var currentArt: UIImage? {
        didSet {
            artPalette = currentArt?.gridColors() ?? []
            if let currentArt, current != nil { nowPlaying.setArtwork(currentArt) }
        }
    }

    var artPalette: [UIColor] = []
    var isPlaying = false
    var progress = 0.0
    var duration = 0.0
    var loading = false
    var currentHasLyrics = false
    var currentBitrate: Int?

    var hasSession = false

    var lastMoveForward = true
    var toast: String?

    var library = LibraryState() {
        didSet { if library.favorites != oldValue.favorites { refreshLiked() } }
    }
    var playlists: [LocalPlaylist] = []
    var recentSearches = RecentSearches()
    var favoriteItems: [LibraryItem] { library.favorites }
    var recentItems: [LibraryItem] { library.recents }

    var homeSlate: [QueueItem] = []
    var homeReasons: [String] = []
    var homeReady = false

    var homeFailed = false
    var homeVersion = 0
    var modelStats: PersonalizedStats?
    var modelStatsLoading = false

    @ObservationIgnored let player = AVPlayer()
    @ObservationIgnored let nowPlaying = NowPlaying()
    @ObservationIgnored let undoStack = UndoStack()
    @ObservationIgnored let ranking = RankingWorker()
    @ObservationIgnored let network = NetworkMonitor()
    @ObservationIgnored let encoder = SongEncoder.bundled()
    @ObservationIgnored var lastSong: SongFeatures?
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

    @ObservationIgnored var knownSongs: [String: SongFeatures] = [:]
    @ObservationIgnored var displayCache: [String: SongDisplay] = [:]
    @ObservationIgnored var lyricsCache: [String: String] = [:]
    @ObservationIgnored var recentSearchesBlocked = false

    @ObservationIgnored var failures = 0
    @ObservationIgnored var streamFailures = 0
    @ObservationIgnored var sessionActive = false

    @ObservationIgnored var resumeFromQueue = false
    @ObservationIgnored var endToken: NSObjectProtocol?
    @ObservationIgnored var failToken: NSObjectProtocol?
    @ObservationIgnored var stallToken: NSObjectProtocol?
    @ObservationIgnored var statusObservation: NSKeyValueObservation?

    var onboarded: Bool { !settings.languages.isEmpty }
    var learningGate: LearningGate { LearningGate(paused: settings.personalizationPaused) }
    var delivery: Delivery {
        Delivery(quality: StreamQuality.preference(wifi: settings.wifiQuality, cellular: settings.cellularQuality,
                                                   network: network.kind, dataSaver: settings.dataSaver),
                 allowExplicit: settings.allowExplicit,
                 smallArtwork: settings.dataSaver && network.kind == .cellular)
    }
    var undoAvailable: Bool { undoStack.isAvailable }
    var undoLabel: String? { undoStack.label }
    var sleepTimer: SleepTimer { sleep.kind }
    var sleepDeadline: Date? { sleep.deadline }

    init() {
        loadState()
        loadRecentSearches()
        reconcileLikes()
        AppLog.info("launch", "profile dim \(SparseLearner.dimension), observations \(profile.learner.observations), "
            + "languages \(settings.languages), favorites \(library.favorites.count), paused \(settings.personalizationPaused)")
        network.onChange = { [weak self] in self?.deliveryChanged() }
        restoreLastSong()
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

    func deliveryChanged() {
        resolved.removeAll()
        pool = []
        invalidateRanking()
    }

    private func restoreLastSong() {
        guard settings.resumeOnLaunch, let song = lastSong else { return }
        let item = QueueItem(song: song, why: "Resuming")
        current = item
        hasSession = true
        loadArt(for: item)
    }

    private func tick(_ time: CMTime) {
        progress = max(0, time.seconds)
        if duration <= 0, let d = player.currentItem?.duration.seconds, d.isFinite, d > 0 {
            duration = d; syncNowPlaying()
        }

        if player.timeControlStatus == .playing, player.currentItem != nil, !playback.closed { playback.markStarted() }
        let playing = player.timeControlStatus != .paused
        if playing != isPlaying, player.currentItem != nil { isPlaying = playing; syncNowPlaying() }
    }
}
