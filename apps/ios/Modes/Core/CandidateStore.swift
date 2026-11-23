import Foundation

struct CandidateHit: Sendable {
    let hit: SaavnAPI.Hit
    let source: String
    let ranks: [Int]
}

struct CandidateBatch: Sendable {
    var hits: [CandidateHit] = []
    var failed = false
}

enum CandidateSource {
    private struct Entry: Sendable {
        let hit: SaavnAPI.Hit
        let rank: Int?
    }

    static func fetch(languages: [String], seeds: [String], delivery: Delivery) async -> CandidateBatch {
        await withTaskGroup(of: [Entry]?.self) { group in
            for language in languages.prefix(3) {
                group.addTask {
                    try? await SaavnAPI.trending(language: language, delivery: delivery).map { Entry(hit: $0, rank: nil) }
                }
            }
            for seed in seeds.prefix(3) {
                group.addTask {
                    try? await SaavnAPI.suggestions(songID: seed, delivery: delivery).enumerated()
                        .map { Entry(hit: $1, rank: $0) }
                }
            }
            var requests = 0, answered = 0
            var order: [String] = []
            var hits: [String: SaavnAPI.Hit] = [:]
            var ranks: [String: [Int]] = [:]
            for await result in group {
                requests += 1
                guard let result else { continue }
                answered += 1
                for entry in result {
                    let id = entry.hit.id
                    if hits[id] == nil { order.append(id); hits[id] = entry.hit }
                    if let rank = entry.rank { ranks[id, default: []].append(rank) }
                }
            }
            var batch = CandidateBatch()
            batch.hits = order.compactMap { id in
                hits[id].map { CandidateHit(hit: $0, source: ranks[id] == nil ? "trending" : "similar", ranks: ranks[id] ?? []) }
            }
            batch.failed = requests > 0 && answered == 0
            return batch
        }
    }
}
