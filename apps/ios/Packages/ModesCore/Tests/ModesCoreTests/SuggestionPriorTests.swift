import Testing
@testable import ModesCore

struct SuggestionPriorTests {
    @Test func bonusDecaysWithRankAndAddsAcrossSeeds() {
        #expect(SuggestionPrior.bonus(ranks: []) == 0)
        #expect(abs(SuggestionPrior.bonus(ranks: [0]) - 0.15) < 1e-6)
        #expect(abs(SuggestionPrior.bonus(ranks: [5]) - 0.075) < 1e-6)
        #expect(SuggestionPrior.bonus(ranks: [0, 0]) > SuggestionPrior.bonus(ranks: [0]))
        #expect(SuggestionPrior.bonus(ranks: [0]) > SuggestionPrior.bonus(ranks: [10]))
    }

    @Test func bonusIsCapped() {
        #expect(SuggestionPrior.bonus(ranks: Array(repeating: 0, count: 20)) == SuggestionPrior.cap)
    }

    @Test func aSuggestedCandidateOutranksAnOtherwiseIdenticalOne() {
        let plain = SongFeatures(id: "1", title: "Same", artist: "Artist One", language: "hindi")
        let suggested = SongFeatures(id: "2", title: "Same", artist: "Artist Two", language: "hindi")
        let candidates = [RankedCandidate(song: plain, features: SparseFeatures(indices: [1], values: [1], labels: [""]), source: "trending"),
                          RankedCandidate(song: suggested, features: SparseFeatures(indices: [1], values: [1], labels: [""]),
                                          source: "similar", suggestionRanks: [0])]
        var generator = SystemRandomNumberGenerator()
        let ranked = PersonalizedRanker.rank(candidates, profile: PersonalizedProfile(), options: RankOptions(count: 2), using: &generator)
        #expect(ranked.map(\.id) == ["2", "1"])
        #expect(ranked.first?.source == "similar")
    }
}
