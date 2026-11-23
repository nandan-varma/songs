import Foundation
import Testing
@testable import ModesCore

struct RecommendationTests {
    private func song(_ id: String, title: String = "Song", artist: String = "Artist",
                      album: String = "Album", language: String = "hindi", year: Int = 2024) -> SongFeatures {
        SongFeatures(id: id, title: title, artist: artist, album: album, language: language, year: year)
    }

    @Test func hashingIsStableAndNormalised() {
        let first = FeatureHasher.vector(for: song("1", title: "Love Story", artist: "Arijit Singh"))
        let second = FeatureHasher.vector(for: song("1", title: "Love Story", artist: "Arijit Singh"))
        let other = FeatureHasher.vector(for: song("2", title: "Different", artist: "Someone Else"))
        #expect(first == second)
        #expect(first != other)
        #expect(!first.isEmpty)
        #expect(first.indices.count == first.values.count)
        #expect(first.labels.count == first.values.count)
        let norm = first.values.reduce(Float(0)) { $0 + $1 * $1 }
        #expect(abs(norm - 1) < 0.001)
    }

    @Test func positiveEvidenceRaisesSimilarSongsAndNegativeLowers() {
        var profile = PersonalizedProfile()
        let seed = song("1", title: "Love Story", artist: "Arijit Singh")
        let similar = song("2", title: "Love Story 2", artist: "Arijit Singh")
        let unrelated = song("3", title: "Heavy Metal", artist: "Someone Else")

        profile.learn(seed, signal: .picked)
        let seedScore = profile.learner.mean(FeatureHasher.vector(for: seed))
        let similarScore = profile.learner.mean(FeatureHasher.vector(for: similar))
        let unrelatedScore = profile.learner.mean(FeatureHasher.vector(for: unrelated))
        #expect(seedScore > 0)
        #expect(similarScore > unrelatedScore)

        profile.learn(unrelated, signal: .rejected)
        #expect(profile.learner.mean(FeatureHasher.vector(for: unrelated)) < 0)
        #expect(profile.banned == ["3"])
    }

    @Test func pausedLearningSkipsWeightsButStillExcludes() {
        var profile = PersonalizedProfile()
        let paused = LearningGate(paused: true)
        let target = song("1")
        profile.learn(target, signal: .favorite, gate: paused)
        #expect(profile.learner.observations == 0)
        #expect(profile.liked == ["1"])
        profile.learn(target, signal: .rejected, gate: paused)
        #expect(profile.learner.observations == 0)
        #expect(profile.banned == ["1"])
    }

    @Test func unheardSkipsDoNotTrain() {
        var profile = PersonalizedProfile()
        profile.learn(song("1"), signal: .skipped(fraction: 0, heard: false))
        #expect(profile.learner.observations == 0)
        profile.learn(song("1"), signal: .skipped(fraction: 0, heard: true))
        #expect(profile.learner.observations == 1)
        #expect(profile.learner.mean(FeatureHasher.vector(for: song("1"))) < 0)
    }

    @Test func rankingFiltersExclusionsRecentAndLanguages() {
        var profile = PersonalizedProfile()
        profile.banned = ["banned"]
        profile.recent = ["recent"]
        let candidates = [
            RankedCandidate(song: song("keep", artist: "A"), source: "trending"),
            RankedCandidate(song: song("banned", artist: "B"), source: "trending"),
            RankedCandidate(song: song("recent", artist: "C"), source: "trending"),
            RankedCandidate(song: song("english", artist: "D", language: "english"), source: "search")
        ]
        var generator = SeededGenerator(seed: 1)
        let ranked = PersonalizedRanker.rank(candidates, profile: profile,
                                             options: RankOptions(count: 10, languages: ["hindi"]),
                                             using: &generator)
        #expect(ranked.map(\.id) == ["keep"])
    }

    @Test func rankingKeepsArtistsApartAndCapsRepeats() {
        let candidates = (0..<4).map { index in
            RankedCandidate(song: song("\(index)", artist: "Same Artist", album: "Same Album"), source: "test")
        }
        var generator = SeededGenerator(seed: 2)
        let ranked = PersonalizedRanker.rank(candidates, profile: PersonalizedProfile(),
                                             options: RankOptions(count: 4, maxPerArtist: 1), using: &generator)
        #expect(ranked.count == 1)
    }

    @Test func zeroExplorationIsDeterministic() {
        let candidates = (0..<8).map { index in
            RankedCandidate(song: song("\(index)", artist: "Artist \(index)", album: "Album \(index)"), source: "test")
        }
        var first = SeededGenerator(seed: 1), second = SeededGenerator(seed: 2)
        let firstRank = PersonalizedRanker.rank(candidates, profile: PersonalizedProfile(), options: RankOptions(count: 5), using: &first)
        let secondRank = PersonalizedRanker.rank(candidates, profile: PersonalizedProfile(), options: RankOptions(count: 5), using: &second)
        #expect(firstRank.map(\.id) == secondRank.map(\.id))
    }

    @Test func explanationUsesALearnedToken() {
        var profile = PersonalizedProfile()
        let target = song("1", title: "Love Story", artist: "Arijit Singh")
        profile.learn(target, signal: .favorite)
        let explanation = profile.learner.explanation(for: FeatureHasher.vector(for: target))
        #expect(explanation != nil)
        #expect(explanation?.isEmpty == false)
    }

    @Test func profileAndLearnerRoundTrip() throws {
        var profile = PersonalizedProfile()
        profile.learn(song("1"), signal: .favorite)
        profile.banned = ["2"]
        let data = try PropertyListEncoder().encode(profile)
        let decoded = try PropertyListDecoder().decode(PersonalizedProfile.self, from: data)
        #expect(decoded.learner.observations == 1)
        #expect(decoded.banned == ["2"])
        #expect(decoded.learner.mean(FeatureHasher.vector(for: song("1"))) > 0)
    }
}

struct PersonalizationContractTests {
    @Test func staleResultsAreRejectedByRevisionOrQueue() {
        let profile = PersonalizedProfile()
        let request = PersonalizedRankingRequest(revision: 2, queueRevision: 5, profile: profile,
                                                 candidates: [], options: RankOptions(count: 5))
        #expect(request.isCurrent(revision: 2, queueRevision: 5))
        #expect(!request.isCurrent(revision: 3, queueRevision: 5))
        #expect(!request.isCurrent(revision: 2, queueRevision: 6))
        let home = PersonalizedRankingRequest(revision: 2, queueRevision: nil, profile: profile,
                                             candidates: [], options: RankOptions(count: 5))
        #expect(home.isCurrent(revision: 2, queueRevision: 99))
    }

    @Test func statsCountLearnedFeaturesAndEvidence() {
        var profile = PersonalizedProfile()
        profile.learn(SongFeatures(id: "1", title: "A", artist: "X"), signal: .favorite)
        profile.banned = ["2"]
        let stats = PersonalizedStats(profile: profile)
        #expect(stats.observations == 1)
        #expect(stats.liked == 1)
        #expect(stats.banned == 1)
        #expect(stats.activeFeatures > 0)
    }
}
