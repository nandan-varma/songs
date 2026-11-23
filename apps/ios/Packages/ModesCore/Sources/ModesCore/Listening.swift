import Foundation

public struct ListenRecord: Codable, Sendable, Equatable {
    public enum Outcome: String, Codable, Sendable { case completed, skipped, switched, rejected }

    public var songID: String
    public var title: String
    public var artist: String
    public var language: String
    public var imageURL: URL?
    public var source: String?
    public var startedAt: Date
    public var duration: Double
    public var secondsHeard: Double
    public var pauses: Int
    public var seeksBack: Int
    public var seeksForward: Int
    public var outcome: Outcome

    public var fraction: Double { duration > 0 ? min(1, secondsHeard / duration) : 0 }
    public var heard: Bool { secondsHeard >= 1 }
}

public struct ListeningTally: Sendable {
    private var song: SongFeatures?
    private var source: String?
    private var startedAt = Date()
    private var duration = 0.0
    private var seconds = 0.0
    private var pauses = 0
    private var seeksBack = 0
    private var seeksForward = 0
    private var rewound = false

    public init() {}

    public var isOpen: Bool { song != nil }
    public var seekedBack: Bool { rewound }

    public mutating func begin(_ song: SongFeatures, source: String?, duration: Double, at date: Date = Date()) {
        self = ListeningTally()
        self.song = song; self.source = source; self.duration = duration; startedAt = date
    }

    public mutating func advance(by seconds: Double) {
        guard song != nil, seconds > 0, seconds < 5 else { return }
        self.seconds += seconds
    }

    public mutating func paused() { if song != nil { pauses += 1 } }

    public mutating func seeked(from: Double, to: Double) {
        guard song != nil else { return }
        if to < from - 2 {
            seeksBack += 1
            if duration > 0, from / duration >= 0.5 { rewound = true }
        } else if to > from + 2 { seeksForward += 1 }
    }

    public mutating func finish(_ outcome: ListenRecord.Outcome) -> ListenRecord? {
        guard let song else { return nil }
        let record = ListenRecord(songID: song.id, title: song.title, artist: song.artist, language: song.language,
                                  imageURL: song.image, source: source, startedAt: startedAt, duration: duration,
                                  secondsHeard: seconds, pauses: pauses, seeksBack: seeksBack, seeksForward: seeksForward,
                                  outcome: outcome)
        self = ListeningTally()
        return record
    }
}

public struct ListeningStats: Codable, Sendable, Equatable {
    public struct Entry: Codable, Sendable, Equatable {
        public var name: String
        public var secondsHeard = 0.0
        public var plays = 0
        public var completions = 0
        public var skips = 0
        public var lastPlayed = Date.distantPast
        public var imageURL: URL?
        public var detail = ""

        public var skipRate: Double { plays > 0 ? Double(skips) / Double(plays) : 0 }
    }

    public static let maxSongs = 2_000
    public static let maxDays = 400

    public private(set) var totalSeconds = 0.0
    public private(set) var plays = 0
    public private(set) var completions = 0
    public private(set) var skips = 0
    public private(set) var replays = 0
    public private(set) var fractionSum = 0.0
    public private(set) var songs: [String: Entry] = [:]
    public private(set) var artists: [String: Entry] = [:]
    public private(set) var languages: [String: Entry] = [:]
    public private(set) var days: [String: Double] = [:]
    public private(set) var hours = [Double](repeating: 0, count: 24)
    public private(set) var weekdays = [Double](repeating: 0, count: 7)

    public init() {}

    public var skipRate: Double { plays > 0 ? Double(skips) / Double(plays) : 0 }
    public var completionRate: Double { plays > 0 ? Double(completions) / Double(plays) : 0 }
    public var averageFractionHeard: Double { plays > 0 ? fractionSum / Double(plays) : 0 }

    public static func dayKey(_ date: Date, calendar: Calendar = .current) -> String {
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    public func plays(of songID: String) -> Int { songs[songID]?.plays ?? 0 }

    public mutating func add(_ record: ListenRecord, calendar: Calendar = .current) {
        guard record.heard else { return }
        plays += 1
        totalSeconds += record.secondsHeard
        fractionSum += record.fraction
        if record.outcome == .completed { completions += 1 }
        if record.outcome == .skipped || record.outcome == .rejected { skips += 1 }
        if record.seeksBack > 0 { replays += 1 }

        func bump(_ table: inout [String: Entry], _ key: String, name: String, detail: String = "") {
            guard !key.isEmpty else { return }
            var entry = table[key] ?? Entry(name: name)
            entry.secondsHeard += record.secondsHeard
            entry.plays += 1
            if record.outcome == .completed { entry.completions += 1 }
            if record.outcome == .skipped || record.outcome == .rejected { entry.skips += 1 }
            entry.lastPlayed = record.startedAt
            if entry.imageURL == nil { entry.imageURL = record.imageURL }
            if !detail.isEmpty { entry.detail = detail }
            table[key] = entry
        }
        bump(&songs, record.songID, name: record.title, detail: record.artist)
        let primary = record.artist.split(separator: ",").first.map { $0.trimmingCharacters(in: .whitespaces) } ?? record.artist
        bump(&artists, primary.lowercased(), name: primary)
        bump(&languages, record.language.lowercased(), name: record.language.capitalized)

        days[Self.dayKey(record.startedAt, calendar: calendar), default: 0] += record.secondsHeard
        hours[calendar.component(.hour, from: record.startedAt)] += record.secondsHeard
        weekdays[calendar.component(.weekday, from: record.startedAt) - 1] += record.secondsHeard
        trim()
    }

    private mutating func trim() {
        if songs.count > Self.maxSongs {
            let keep = songs.sorted { $0.value.lastPlayed > $1.value.lastPlayed }.prefix(Self.maxSongs)
            songs = Dictionary(uniqueKeysWithValues: keep.map { ($0.key, $0.value) })
        }
        if days.count > Self.maxDays {
            for key in days.keys.sorted().prefix(days.count - Self.maxDays) { days[key] = nil }
        }
    }

    public func topArtists(_ limit: Int = 10) -> [Entry] {
        artists.values.sorted { $0.secondsHeard > $1.secondsHeard }.prefix(limit).map { $0 }
    }

    public func topSongs(_ limit: Int = 10) -> [(id: String, entry: Entry)] {
        songs.sorted { $0.value.plays != $1.value.plays ? $0.value.plays > $1.value.plays : $0.value.secondsHeard > $1.value.secondsHeard }
            .prefix(limit).map { ($0.key, $0.value) }
    }

    public func topLanguages(_ limit: Int = 5) -> [Entry] {
        languages.values.sorted { $0.secondsHeard > $1.secondsHeard }.prefix(limit).map { $0 }
    }

    public func seconds(inLast days: Int, now: Date = Date(), calendar: Calendar = .current) -> Double {
        (0..<days).reduce(0) { total, offset in
            guard let date = calendar.date(byAdding: .day, value: -offset, to: now) else { return total }
            return total + (self.days[Self.dayKey(date, calendar: calendar)] ?? 0)
        }
    }

    public func streak(now: Date = Date(), calendar: Calendar = .current) -> Int {
        var count = 0
        var cursor = now
        if (days[Self.dayKey(cursor, calendar: calendar)] ?? 0) == 0, let yesterday = calendar.date(byAdding: .day, value: -1, to: cursor) {
            cursor = yesterday
        }
        while (days[Self.dayKey(cursor, calendar: calendar)] ?? 0) > 0 {
            count += 1
            guard let previous = calendar.date(byAdding: .day, value: -1, to: cursor) else { break }
            cursor = previous
        }
        return count
    }

    public var favouriteHour: Int? {
        guard let peak = hours.enumerated().max(by: { $0.element < $1.element }), peak.element > 0 else { return nil }
        return peak.offset
    }
}
