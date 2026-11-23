import Foundation

/// One song's sparse hashed features. Labels are kept parallel to indices for explanations.
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

/// Stateless metadata featurisation: no per-song index, no server artefact.
/// Signed FNV-1a hashing into 2^15 buckets, weights from the offline cold-start experiment.
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

        for artist in song.artistNames { add("a|" + artist, 0.50) }
        for composer in song.composer.split(separator: ",") {
            let name = composer.trimmingCharacters(in: .whitespaces).lowercased()
            if !name.isEmpty { add("m|" + name, 0.25) }
        }
        if !song.album.isEmpty { add("al|" + song.album.lowercased(), 1.0) }
        if !song.label.isEmpty { add("lb|" + song.label.lowercased(), 0.50) }
        if !song.language.isEmpty { add("lg|" + song.language.lowercased(), 0.50) }
        if song.year > 0 {
            add("y|\(song.year)", 0.25)
            add("d|\(song.year / 5 * 5)", 0.50)
        }
        if let primary = song.artistNames.first, !song.language.isEmpty {
            add("x|\(primary)|\(song.language.lowercased())", 0.50)
        }
        for word in song.titleWords { add("w|" + word, 0.50) }
        if song.explicit { add("e|explicit", 0.10) }

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
