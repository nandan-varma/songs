import Foundation

public struct SparseLearner: Codable, Sendable {
    public static let popularityIndex = FeatureHasher.dimension + ItemEncoder.dimension
    public static let dimension = popularityIndex + 1
    public static let maxRows = 3_000
    static let regularisation: Float = 1
    static let negativeSample = 100
    static let negativeWeight: Float = 0.3
    static let iterations = 80

    struct Row: Codable, Sendable {
        var indices: [Int32]
        var values: [Float]
        var positive: Bool
        var weight: Float
    }

    private(set) var rows: [Row] = []
    public private(set) var observations = 0
    private var weights: [Float] = []
    private var bias: Float = 0
    private var fittedAt = -1

    public init() {}

    private enum CodingKeys: String, CodingKey { case rows, observations }

    public var activeFeatureCount: Int { weights.reduce(0) { $1 != 0 ? $0 + 1 : $0 } }

    public mutating func observe(_ features: SparseFeatures, target: Float, weight: Float) {
        guard weight > 0, !features.isEmpty else { return }
        rows.append(Row(indices: features.indices, values: features.values, positive: target > 0,
                        weight: weight * max(abs(target), 0.2)))
        if rows.count > Self.maxRows { rows.removeFirst(rows.count - Self.maxRows) }
        observations += 1
    }

    public mutating func fit(unlabeled: [SparseFeatures]) {
        guard fittedAt != observations else { return }
        fittedAt = observations
        guard !rows.isEmpty else { weights = []; bias = 0; return }
        var training = rows
        let step = max(1, unlabeled.count / Self.negativeSample)
        for features in stride(from: 0, to: unlabeled.count, by: step).map({ unlabeled[$0] }) where !features.isEmpty {
            training.append(Row(indices: features.indices, values: features.values, positive: false, weight: Self.negativeWeight))
        }
        solve(training)
    }

    private mutating func solve(_ training: [Row]) {
        var slotOf: [Int32: Int] = [:]
        var compact: [[Int]] = []
        compact.reserveCapacity(training.count)
        for row in training {
            compact.append(row.indices.map { index in
                if let slot = slotOf[index] { return slot }
                let slot = slotOf.count
                slotOf[index] = slot
                return slot
            })
        }
        let count = slotOf.count
        var curvature = [Float](repeating: 0, count: count)
        var totalWeight: Float = 0
        for (row, slots) in zip(training, compact) {
            totalWeight += row.weight
            for (slot, value) in zip(slots, row.values) { curvature[slot] += 0.25 * row.weight * value * value }
        }
        var w = [Float](repeating: 0, count: count)
        var b: Float = 0
        var gradient = [Float](repeating: 0, count: count)
        let damping: Float = 0.8
        for _ in 0..<Self.iterations {
            for slot in 0..<count { gradient[slot] = Self.regularisation * w[slot] }
            var biasGradient: Float = 0
            for (row, slots) in zip(training, compact) {
                var margin = b
                for (slot, value) in zip(slots, row.values) { margin += w[slot] * value }
                let error = row.weight * (1 / (1 + exp(-margin)) - (row.positive ? 1 : 0))
                for (slot, value) in zip(slots, row.values) { gradient[slot] += error * value }
                biasGradient += error
            }
            for slot in 0..<count { w[slot] -= damping * gradient[slot] / (curvature[slot] + Self.regularisation) }
            b -= damping * biasGradient / (0.25 * totalWeight + 1e-3)
        }
        var dense = [Float](repeating: 0, count: Self.dimension)
        for (index, slot) in slotOf { dense[Int(index)] = w[slot] }
        weights = dense
        bias = b
    }

    public func score(_ features: SparseFeatures) -> Float {
        guard !weights.isEmpty else { return 0 }
        var total = bias
        for (index, value) in zip(features.indices, features.values) { total += weights[Int(index)] * value }
        return total
    }

    public func sampleScore<G: RandomNumberGenerator>(_ features: SparseFeatures, temperature: Float,
                                                      using generator: inout G) -> Float {
        let mean = score(features)
        guard temperature > 0 else { return mean }
        let first = Float.random(in: 0.0001...1, using: &generator)
        let second = Float.random(in: 0...1, using: &generator)
        let gaussian = (-2 * log(first)).squareRoot() * cos(2 * .pi * second)
        return mean + temperature * gaussian
    }

    public func explanation(for features: SparseFeatures) -> String? {
        guard !weights.isEmpty else { return nil }
        var best: (contribution: Float, label: String)?
        for position in features.indices.indices where Int(features.indices[position]) < FeatureHasher.dimension {
            let contribution = weights[Int(features.indices[position])] * features.values[position]
            if contribution > (best?.contribution ?? 0.05) {
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
