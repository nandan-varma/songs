import Foundation

public struct ItemEncoder: Sendable {
    public static let dimension = 64
    public static let scale: Float = 0.5

    public enum LoadError: Error { case shapeMismatch, vocabulary }

    private let table: Data
    private let index: [String: Int]

    public init(table: Data, tokens: [String]) throws {
        guard table.count == tokens.count * Self.dimension * 2 else { throw LoadError.shapeMismatch }
        self.table = table
        var index: [String: Int] = [:]
        index.reserveCapacity(tokens.count)
        for (position, token) in tokens.enumerated() { index[token] = position }
        self.index = index
    }

    public init(table: Data, vocabulary: Data) throws {
        struct Vocabulary: Decodable { let tokens: [String] }
        guard let decoded = try? JSONDecoder().decode(Vocabulary.self, from: vocabulary) else { throw LoadError.vocabulary }
        try self.init(table: table, tokens: decoded.tokens)
    }

    public func vector(for song: SongFeatures) -> [Float] {
        var sum = [Float](repeating: 0, count: Self.dimension)
        var total: Float = 0
        table.withUnsafeBytes { raw in
            for (token, weight) in song.tokens {
                guard let row = index[token] else { continue }
                let base = row * Self.dimension * 2
                for column in 0..<Self.dimension {
                    sum[column] += weight * Self.half(raw.loadUnaligned(fromByteOffset: base + column * 2, as: UInt16.self))
                }
                total += weight
            }
        }
        guard total > 0 else { return sum }
        var norm: Float = 0
        for column in 0..<Self.dimension {
            sum[column] /= total
            norm += sum[column] * sum[column]
        }
        norm = norm.squareRoot()
        guard norm > 1e-12 else { return [Float](repeating: 0, count: Self.dimension) }
        return sum.map { $0 / norm * Self.scale }
    }

    private static func half(_ bits: UInt16) -> Float {
        let value = UInt16(littleEndian: bits)
        let sign: Float = value & 0x8000 == 0 ? 1 : -1
        let exponent = Int((value >> 10) & 0x1f)
        let fraction = Float(value & 0x3ff)
        switch exponent {
        case 0: return sign * fraction * Float(sign: .plus, exponent: -24, significand: 1)
        case 31: return fraction == 0 ? sign * .infinity : .nan
        default: return sign * (1 + fraction / 1024) * Float(sign: .plus, exponent: exponent - 15, significand: 1)
        }
    }
}

public struct SongEncoder: Sendable {
    public let item: ItemEncoder

    public init(item: ItemEncoder) { self.item = item }

    public func features(for song: SongFeatures) -> SparseFeatures {
        let hashed = FeatureHasher.vector(for: song)
        let dense = item.vector(for: song)
        var indices = hashed.indices, values = hashed.values, labels = hashed.labels
        for (column, value) in dense.enumerated() where value != 0 {
            indices.append(Int32(FeatureHasher.dimension + column))
            values.append(value)
            labels.append("")
        }
        return SparseFeatures(indices: indices, values: values, labels: labels)
    }
}
