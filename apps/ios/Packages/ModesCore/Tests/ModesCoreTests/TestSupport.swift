import Foundation
@testable import ModesCore

/// splitmix64: a tiny seedable generator so ranking tests are deterministic.
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

enum RealCatalog {
    static let dir = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()   // Tests/ModesCoreTests -> Tests -> ModesCore
        .deletingLastPathComponent().deletingLastPathComponent()                               // -> Packages -> ios/Modes
        .appendingPathComponent("Modes/Resources")
    static let jsonURL = dir.appendingPathComponent("catalog.json")
    static let binURL = dir.appendingPathComponent("catalog.bin")
    static let available = FileManager.default.fileExists(atPath: jsonURL.path) && FileManager.default.fileExists(atPath: binURL.path)
    /// Loaded once; the catalog is immutable.
    static let catalog: Catalog? = try? Catalog(jsonURL: jsonURL, binURL: binURL)
}
