import Foundation

struct CandidateHit: Sendable {
    let hit: SaavnAPI.Hit
    let source: String
}

struct CandidateBatch: Sendable {
    var hits: [CandidateHit] = []

    var failed = false
}

enum CandidateSource {
    static func fetch(languages: [String], seeds: [String], delivery: Delivery) async -> CandidateBatch {
        await withTaskGroup(of: [CandidateHit]?.self) { group in
            for language in languages.prefix(3) {
                group.addTask {
                    try? await SaavnAPI.trending(language: language, delivery: delivery)
                        .map { CandidateHit(hit: $0, source: "trending") }
                }
            }
            for seed in seeds.prefix(3) {
                group.addTask {
                    try? await SaavnAPI.suggestions(songID: seed, delivery: delivery)
                        .map { CandidateHit(hit: $0, source: "similar") }
                }
            }
            var batch = CandidateBatch()
            var requests = 0, answered = 0
            var seen = Set<String>()
            for await result in group {
                requests += 1
                guard let result else { continue }
                answered += 1
                for candidate in result where seen.insert(candidate.hit.song.id).inserted { batch.hits.append(candidate) }
            }
            batch.failed = requests > 0 && answered == 0
            return batch
        }
    }
}
