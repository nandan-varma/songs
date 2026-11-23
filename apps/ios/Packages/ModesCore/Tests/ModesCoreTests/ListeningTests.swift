import Foundation
import Testing
@testable import ModesCore

struct ListeningTests {
    private let song = SongFeatures(id: "1", title: "Raanaa", artist: "Arijit Singh, Someone", language: "telugu", duration: 200)

    private func record(_ tally: inout ListeningTally, seconds: Double, outcome: ListenRecord.Outcome, at date: Date = Date()) -> ListenRecord {
        tally.begin(song, source: "home", duration: 200, at: date)
        for _ in 0..<Int(seconds) { tally.advance(by: 1) }
        return tally.finish(outcome)!
    }

    @Test func tallyCountsPlayingSecondsPausesAndSeeks() {
        var tally = ListeningTally()
        tally.begin(song, source: nil, duration: 200)
        for _ in 0..<30 { tally.advance(by: 1) }
        tally.paused()
        tally.seeked(from: 120, to: 10)
        tally.seeked(from: 10, to: 100)
        for _ in 0..<4 { tally.advance(by: 1) }
        let result = tally.finish(.skipped)!
        #expect(result.secondsHeard == 34)
        #expect(result.pauses == 1)
        #expect(result.seeksBack == 1 && result.seeksForward == 1)
        #expect(abs(result.fraction - 0.17) < 0.001)
        #expect(!tally.isOpen)
    }

    @Test func implausibleTickGapsAreIgnored() {
        var tally = ListeningTally()
        tally.begin(song, source: nil, duration: 200)
        tally.advance(by: 600)
        #expect(tally.finish(.completed)!.secondsHeard == 0)
    }

    @Test func rewindingLateInASongIsARepeatSignal() {
        var tally = ListeningTally()
        tally.begin(song, source: nil, duration: 200)
        tally.seeked(from: 150, to: 5)
        #expect(tally.seekedBack)
    }

    @Test func statsAggregateByArtistLanguageAndDay() {
        var stats = ListeningStats()
        var tally = ListeningTally()
        let day = Date(timeIntervalSince1970: 1_800_000_000)
        stats.add(record(&tally, seconds: 200, outcome: .completed, at: day))
        stats.add(record(&tally, seconds: 20, outcome: .skipped, at: day))
        #expect(stats.plays == 2)
        #expect(stats.totalSeconds == 220)
        #expect(stats.completions == 1 && stats.skips == 1)
        #expect(stats.skipRate == 0.5)
        #expect(stats.plays(of: "1") == 2)
        #expect(stats.topArtists().first?.name == "Arijit Singh")
        #expect(stats.topLanguages().first?.name == "Telugu")
        #expect(stats.days[ListeningStats.dayKey(day)] == 220)
    }

    @Test func unheardPlaysAreNotCounted() {
        var stats = ListeningStats()
        var tally = ListeningTally()
        stats.add(record(&tally, seconds: 0, outcome: .skipped))
        #expect(stats.plays == 0)
    }

    @Test func streakCountsConsecutiveDaysEndingTodayOrYesterday() {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC")!
        let now = Date(timeIntervalSince1970: 1_800_000_000)
        var stats = ListeningStats()
        var tally = ListeningTally()
        for offset in [1, 2, 3, 5] {
            let day = calendar.date(byAdding: .day, value: -offset, to: now)!
            stats.add(record(&tally, seconds: 60, outcome: .completed, at: day), calendar: calendar)
        }
        #expect(stats.streak(now: now, calendar: calendar) == 3)
        #expect(stats.seconds(inLast: 7, now: now, calendar: calendar) == 240)
    }

    @Test func songTableIsBounded() {
        var stats = ListeningStats()
        var tally = ListeningTally()
        for index in 0..<(ListeningStats.maxSongs + 50) {
            var other = song
            other.id = "s\(index)"
            tally.begin(other, source: nil, duration: 100, at: Date(timeIntervalSince1970: Double(index)))
            for _ in 0..<10 { tally.advance(by: 1) }
            stats.add(tally.finish(.completed)!)
        }
        #expect(stats.songs.count == ListeningStats.maxSongs)
        #expect(stats.songs["s0"] == nil)
    }

    @Test func statsRoundTripThroughPropertyList() throws {
        var stats = ListeningStats()
        var tally = ListeningTally()
        stats.add(record(&tally, seconds: 90, outcome: .completed))
        let decoded = try PropertyListDecoder().decode(ListeningStats.self, from: PropertyListEncoder().encode(stats))
        #expect(decoded == stats)
    }
}

struct LearnerQualityTests {
    private func song(_ id: String, artist: String, language: String = "hindi", plays: Int = 1_000) -> SongFeatures {
        SongFeatures(id: id, title: "Song \(id)", artist: artist, album: "Album \(artist)", language: language, year: 2020, playCount: plays)
    }

    @Test func fittedLearnerPrefersTheLikedArtistOverBackground() {
        var learner = SparseLearner()
        let encoder = TestEncoder.encoder
        for index in 0..<6 { learner.observe(encoder.features(for: song("a\(index)", artist: "Liked Artist")), target: 1, weight: 1) }
        let background = (0..<40).map { encoder.features(for: song("b\($0)", artist: "Other \($0 % 7)")) }
        learner.fit(unlabeled: background)
        let liked = learner.score(encoder.features(for: song("new", artist: "Liked Artist")))
        let other = learner.score(encoder.features(for: song("new2", artist: "Stranger")))
        #expect(liked > other)
    }

    @Test func skippedArtistFallsBelowNeutral() {
        var learner = SparseLearner()
        let encoder = TestEncoder.encoder
        for index in 0..<4 { learner.observe(encoder.features(for: song("l\(index)", artist: "Liked")), target: 1, weight: 1) }
        for index in 0..<4 { learner.observe(encoder.features(for: song("d\(index)", artist: "Disliked")), target: -1, weight: 3) }
        learner.fit(unlabeled: (0..<30).map { encoder.features(for: song("b\($0)", artist: "Other \($0)")) })
        #expect(learner.score(encoder.features(for: song("x", artist: "Disliked"))) < learner.score(encoder.features(for: song("y", artist: "Other 3"))))
    }

    @Test func historyIsCappedAndFitIsIdempotent() {
        var learner = SparseLearner()
        let encoder = TestEncoder.encoder
        for index in 0..<(SparseLearner.maxRows + 20) {
            learner.observe(encoder.features(for: song("s\(index)", artist: "Artist \(index % 5)")), target: 1, weight: 1)
        }
        #expect(learner.observations == SparseLearner.maxRows + 20)
        learner.fit(unlabeled: [])
        let before = learner.score(encoder.features(for: song("z", artist: "Artist 1")))
        learner.fit(unlabeled: [])
        #expect(learner.score(encoder.features(for: song("z", artist: "Artist 1"))) == before)
    }

    @Test func popularityFeatureIsBounded() {
        #expect(SongEncoder.popularity(0) == -3)
        #expect(SongEncoder.popularity(Int.max / 2) == 3)
    }
}
