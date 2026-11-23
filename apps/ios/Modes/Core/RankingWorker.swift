import Foundation
import ModesCore

/// Runs sparse ranking away from the main actor. Requests and results are immutable snapshots.
actor RankingWorker {
    private let catalog: Catalog
    private var fallbackPool: [RankedCandidate] = []
    private var fallbackKey = ""

    init(catalog: Catalog) { self.catalog = catalog }

    func fallback(languages: [String], limit: Int = 1_500) -> [RankedCandidate] {
        let key = languages.joined(separator: ",")
        if key == fallbackKey, !fallbackPool.isEmpty { return fallbackPool }
        let languageSet = Set(languages)
        var indices = (0..<catalog.count).filter { languageSet.isEmpty || languageSet.contains(catalog.items[$0].lang) }
        if let hot = catalog.attrIndex("hot") {
            indices.sort { catalog.attr($0, hot) > catalog.attr($1, hot) }
        }
        if indices.count > limit { indices = Array(indices.prefix(limit)) }
        fallbackPool = indices.map { RankedCandidate(song: SongFeatures(catalogItem: catalog.items[$0]), source: "catalog") }
        fallbackKey = key
        return fallbackPool
    }

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
