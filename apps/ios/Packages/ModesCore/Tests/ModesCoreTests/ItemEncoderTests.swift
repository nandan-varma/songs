import Foundation
import Testing
@testable import ModesCore

struct ItemEncoderTests {
    private struct Golden: Decodable {
        struct Entry: Decodable {
            let song: SongFeatures
            let tokens: [[GoldenToken]]
            let knownTokens: Int
            let vector: [Float]
        }
        let dim: Int
        let songs: [Entry]
    }

    private enum GoldenToken: Decodable {
        case name(String), weight(Double)

        init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()
            if let name = try? container.decode(String.self) { self = .name(name) } else { self = .weight(try container.decode(Double.self)) }
        }
    }

    private func golden() throws -> Golden {
        let url = try #require(Bundle.module.url(forResource: "golden", withExtension: "json", subdirectory: "Resources"))
        return try JSONDecoder().decode(Golden.self, from: Data(contentsOf: url))
    }

    @Test func tokenisationMatchesTheResearchOracle() throws {
        for entry in try golden().songs {
            let expected = entry.tokens.compactMap { pair -> String? in
                if case .name(let name) = pair[0] { name } else { nil }
            }
            #expect(entry.song.tokens.map(\.token) == expected, "tokens differ for \(entry.song.id)")
        }
    }

    @Test func vectorsMatchTheResearchOracle() throws {
        let songs = try golden().songs
        #expect(songs.count == 30)
        var zero = 0
        for entry in songs {
            let vector = TestEncoder.item.vector(for: entry.song)
            #expect(vector.count == ItemEncoder.dimension)
            for (got, want) in zip(vector, entry.vector) { #expect(abs(got - want) < 1e-3, "vector differs for \(entry.song.id)") }
            if entry.knownTokens == 0 { zero += 1; #expect(vector.allSatisfy { $0 == 0 }) }
        }
        #expect(zero >= 2)
    }

    @Test func denseDimsAreAppendedAfterTheHashedRange() throws {
        let song = try #require(try golden().songs.first?.song)
        let features = TestEncoder.encoder.features(for: song)
        let dense = zip(features.indices, features.values).filter { Int($0.0) >= FeatureHasher.dimension }
        #expect(!dense.isEmpty)
        #expect(features.indices.allSatisfy { Int($0) < SparseLearner.dimension })
        let norm = dense.reduce(Float(0)) { $0 + $1.1 * $1.1 }.squareRoot()
        #expect(abs(norm - ItemEncoder.scale) < 1e-3)
    }

    @Test func aMismatchedTableIsRejected() {
        #expect(throws: ItemEncoder.LoadError.self) { try ItemEncoder(table: Data(count: 10), tokens: ["a|x"]) }
    }
}
