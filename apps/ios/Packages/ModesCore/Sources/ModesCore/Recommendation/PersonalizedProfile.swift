import Foundation

public enum PlaybackSignal: Sendable {
    case completed
    case skipped(fraction: Double, heard: Bool)
    case favorite
    case rejected
    case picked
}

public struct PersonalizedProfile: Codable, Sendable {
    public var learner: SparseLearner
    public var banned: [String] = []
    public var recent: [String] = []
    public var liked: [String] = []

    public init(prior: Float = 1) {
        learner = SparseLearner(prior: prior)
    }

    public mutating func learn(_ song: SongFeatures, signal: PlaybackSignal, gate: LearningGate = LearningGate()) {
        let features = FeatureHasher.vector(for: song)
        switch signal {
        case .completed:
            learn(features, target: 1, weight: 1, gate: gate, signal: .completion)
        case .skipped(let fraction, let heard):
            guard heard else { return }
            let target = Float(2 * min(max(fraction, 0), 1) - 1)
            learn(features, target: target, weight: 1, gate: gate,
                  signal: fraction < 0.5 ? .skip : .partialListen)
        case .favorite:
            setLiked(song.id, true)
            learn(features, target: 1, weight: 4, gate: gate, signal: .favorite)
        case .rejected:
            if !banned.contains(song.id) { banned.append(song.id) }
            if banned.count > 1_000 { banned.removeFirst(banned.count - 1_000) }
            learn(features, target: -1, weight: 3, gate: gate, signal: .rejection)
        case .picked:
            learn(features, target: 1, weight: 2, gate: gate, signal: .manualPick)
        }
    }

    public mutating func setLiked(_ id: String, _ liked: Bool) {
        if liked {
            if !self.liked.contains(id) { self.liked.append(id) }
            if self.liked.count > 500 { self.liked.removeFirst(self.liked.count - 500) }
        } else {
            self.liked.removeAll { $0 == id }
        }
    }

    private mutating func learn(_ features: SparseFeatures, target: Float, weight: Float,
                                gate: LearningGate, signal: LearningSignal) {
        guard gate.allows(signal) else { return }
        learner.observe(features, target: target, weight: weight)
    }

    public func featureVector(for song: SongFeatures) -> SparseFeatures {
        FeatureHasher.vector(for: song)
    }
}

public struct PersonalizedSnapshot: Sendable {
    public let learner: SparseLearner
    public let liked: [String]
    public let banned: [String]
    public let recent: [String]

    public init(_ profile: PersonalizedProfile) {
        learner = profile.learner; liked = profile.liked; banned = profile.banned; recent = profile.recent
    }

    public func restore(into profile: inout PersonalizedProfile) {
        profile.learner = learner; profile.liked = liked; profile.banned = banned; profile.recent = recent
    }
}
