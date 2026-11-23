import Foundation

public struct SparseFeatures: Equatable, Sendable {
    public let indices: [Int32]
    public let values: [Float]
    public let labels: [String]

    public init(indices: [Int32], values: [Float], labels: [String]) {
        self.indices = indices
        self.values = values
        self.labels = labels
    }

    public var isEmpty: Bool { indices.isEmpty }
}

public enum FeatureHasher {
    public static let dimension = 1 << 15

    public static func vector(for song: SongFeatures) -> SparseFeatures {
        var values: [Int32: Float] = [:]
        var labels: [Int32: String] = [:]
        var labelStrength: [Int32: Float] = [:]

        func add(_ token: String, _ weight: Float) {
            var hash: UInt64 = 0xcbf2_9ce4_8422_2325
            for byte in token.utf8 {
                hash ^= UInt64(byte)
                hash = hash &* 0x0000_0100_0000_01b3
            }
            let bucket = Int32(hash & 0x7fff)
            let sign: Float = (hash >> 32) & 1 == 0 ? 1 : -1
            values[bucket, default: 0] += weight * sign
            if abs(weight) >= labelStrength[bucket, default: 0] {
                labels[bucket] = token
                labelStrength[bucket] = abs(weight)
            }
        }

        for (token, weight) in song.tokens { add(token, weight) }

        let total = values.values.reduce(Float(0)) { $0 + $1 * $1 }
        let scale = total > 0 ? 1 / total.squareRoot() : 1
        let sorted = values.keys.sorted()
        return SparseFeatures(
            indices: sorted,
            values: sorted.map { values[$0, default: 0] * scale },
            labels: sorted.map { labels[$0] ?? "" }
        )
    }
}
