import Foundation
@testable import ModesCore

struct SeededGenerator: RandomNumberGenerator {
    var state: UInt64
    init(seed: UInt64) { state = seed }
    mutating func next() -> UInt64 {
        state &+= 0x9E37_79B9_7F4A_7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
        z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
        return z ^ (z >> 31)
    }
}

enum TestEncoder {
    static let directory = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        .deletingLastPathComponent().deletingLastPathComponent()
        .appendingPathComponent("Modes/Resources")

    static let item: ItemEncoder = {
        do {
            return try ItemEncoder(table: Data(contentsOf: directory.appendingPathComponent("table_fp16.bin")),
                                   vocabulary: Data(contentsOf: directory.appendingPathComponent("vocab.json")))
        } catch { fatalError("encoder resources missing: \(error)") }
    }()

    static let encoder = SongEncoder(item: item)
}
