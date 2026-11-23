import Foundation
import ModesCore

/// Runs sparse ranking away from the main actor. Requests and results are immutable snapshots.
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
