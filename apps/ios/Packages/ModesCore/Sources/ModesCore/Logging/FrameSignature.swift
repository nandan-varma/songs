import Foundation

public struct FrameSignature: Sendable, Equatable {
    public static let side = 32
    public let pixels: [UInt8]

    public init?(pixels: [UInt8]) {
        guard pixels.count == Self.side * Self.side else { return nil }
        self.pixels = pixels
    }

    public func distance(to other: FrameSignature) -> Double {
        var total = 0
        for i in pixels.indices { total += abs(Int(pixels[i]) - Int(other.pixels[i])) }
        return Double(total) / Double(pixels.count)
    }

    public static func isNew(_ frame: FrameSignature, since previous: FrameSignature?, threshold: Double = 0.8) -> Bool {
        guard let previous else { return true }
        return frame.distance(to: previous) > threshold
    }
}
