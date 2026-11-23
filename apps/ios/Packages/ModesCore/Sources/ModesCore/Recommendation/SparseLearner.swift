import Foundation

public struct SparseLearner: Codable, Sendable {
    public static let dimension = FeatureHasher.dimension + ItemEncoder.dimension

    public private(set) var prior: Float
    public private(set) var precision: [Float]
    public private(set) var information: [Float]
    public private(set) var observations = 0

    public init(prior: Float = 1) {
        self.prior = prior
        precision = [Float](repeating: prior, count: Self.dimension)
        information = [Float](repeating: 0, count: Self.dimension)
    }

    private enum CodingKeys: String, CodingKey { case prior, precision, information, observations }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        prior = try container.decode(Float.self, forKey: .prior)
        precision = try container.decode([Float].self, forKey: .precision)
        information = try container.decode([Float].self, forKey: .information)
        observations = try container.decode(Int.self, forKey: .observations)
        guard precision.count == Self.dimension, information.count == Self.dimension else {
            throw DecodingError.dataCorruptedError(forKey: .precision, in: container,
                                                   debugDescription: "learner shape mismatch")
        }
    }

    public mutating func observe(_ features: SparseFeatures, target: Float, weight: Float) {
        guard weight > 0 else { return }
        for (index, value) in zip(features.indices, features.values) {
            let featureIndex = Int(index)
            let contribution = weight * value * value
            precision[featureIndex] += contribution
            information[featureIndex] += weight * target * value
        }
        observations += 1
    }

    public func mean(_ features: SparseFeatures) -> Float {
        var total: Float = 0
        for (index, value) in zip(features.indices, features.values) {
            let featureIndex = Int(index)
            total += information[featureIndex] / precision[featureIndex] * value
        }
        return total
    }

    public func moments(_ features: SparseFeatures) -> (mean: Float, variance: Float) {
        var mean: Float = 0
        var variance: Float = 0
        for (index, value) in zip(features.indices, features.values) {
            let featureIndex = Int(index)
            mean += information[featureIndex] / precision[featureIndex] * value
            variance += value * value / precision[featureIndex]
        }
        return (mean, variance)
    }

    public func sampleScore<G: RandomNumberGenerator>(_ features: SparseFeatures, temperature: Float,
                                                      using generator: inout G) -> Float {
        let (mean, variance) = moments(features)
        guard temperature > 0, variance > 0 else { return mean }
        let first = Float.random(in: 0.0001...1, using: &generator)
        let second = Float.random(in: 0...1, using: &generator)
        let gaussian = (-2 * log(first)).squareRoot() * cos(2 * .pi * second)
        return mean + temperature * variance.squareRoot() * gaussian
    }

    public func explanation(for features: SparseFeatures) -> String? {
        var best: (contribution: Float, label: String)?
        for position in features.indices.indices where Int(features.indices[position]) < FeatureHasher.dimension {
            let featureIndex = Int(features.indices[position])
            let value = features.values[position]
            let contribution = information[featureIndex] / precision[featureIndex] * value
            if contribution > (best?.contribution ?? 0.02) {
                best = (contribution, features.labels[position])
            }
        }
        guard let best else { return nil }
        return Self.human(best.label)
    }

    private static func human(_ token: String) -> String? {
        guard let split = token.firstIndex(of: "|") else { return nil }
        let kind = String(token[..<split])
        let value = String(token[token.index(after: split)...])
        guard !value.isEmpty else { return nil }
        switch kind {
        case "a": return "Artist \(value.capitalized)"
        case "al": return "Album \(value.capitalized)"
        case "lb": return "Label \(value.capitalized)"
        case "lg": return "\(value.capitalized) music"
        case "y": return "A \(value) release"
        case "d": return "\(value) era"
        case "w": return "The word “\(value)”"
        case "m": return "Composer \(value.capitalized)"
        default: return nil
        }
    }
}
