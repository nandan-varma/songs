import Foundation
import ModesCore

actor RankingWorker {
    func rank(_ request: PersonalizedRankingRequest) -> PersonalizedRankingResult {
        var generator = SystemRandomNumberGenerator()
        let items = PersonalizedRanker.rank(request.candidates, profile: request.profile,
                                            options: request.options, using: &generator)
        return PersonalizedRankingResult(request: request, items: items)
    }

    func stats(_ profile: PersonalizedProfile) -> PersonalizedStats {
        PersonalizedStats(profile: profile)
    }
}
