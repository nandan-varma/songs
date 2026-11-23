import Foundation

public struct PersonalizedRankingRequest: Sendable {
    public let revision: Int
    public let queueRevision: Int?
    public let profile: PersonalizedProfile
    public let candidates: [RankedCandidate]
    public let options: RankOptions

    public init(revision: Int, queueRevision: Int?, profile: PersonalizedProfile,
                candidates: [RankedCandidate], options: RankOptions) {
        self.revision = revision; self.queueRevision = queueRevision
        self.profile = profile; self.candidates = candidates; self.options = options
    }

    public func isCurrent(revision: Int, queueRevision: Int) -> Bool {
        self.revision == revision && (self.queueRevision == nil || self.queueRevision == queueRevision)
    }
}

public struct PersonalizedRankingResult: Sendable {
    public let request: PersonalizedRankingRequest
    public let items: [RankedSong]

    public init(request: PersonalizedRankingRequest, items: [RankedSong]) {
        self.request = request; self.items = items
    }
}

public struct PersonalizedStats: Sendable {
    public let observations: Int
    public let banned: Int
    public let liked: Int
    public let recent: Int
    public let activeFeatures: Int
    public let dimension: Int

    public init(profile: PersonalizedProfile) {
        observations = profile.learner.observations
        banned = profile.banned.count
        liked = profile.liked.count
        recent = profile.recent.count
        dimension = SparseLearner.dimension
        var active = 0
        for precision in profile.learner.precision where precision > profile.learner.prior + 0.0001 { active += 1 }
        activeFeatures = active
    }
}
