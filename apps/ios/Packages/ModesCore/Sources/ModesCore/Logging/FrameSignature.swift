import Foundation

/// A tiny grayscale thumbnail of a screenshot, used to decide whether the screen changed since the last capture.
/// The caller downsamples to `side`×`side` 8-bit gray; comparing two signatures is a mean absolute difference.
public struct FrameSignature: Sendable, Equatable {
    public static let side = 32
    public let pixels: [UInt8]

    public init?(pixels: [UInt8]) {
        guard pixels.count == Self.side * Self.side else { return nil }
        self.pixels = pixels
    }

    /// Mean absolute difference in 0…255 gray levels.
    public func distance(to other: FrameSignature) -> Double {
        var total = 0
        for i in pixels.indices { total += abs(Int(pixels[i]) - Int(other.pixels[i])) }
        return Double(total) / Double(pixels.count)
    }

    /// A new frame is worth saving if it is the first one or differs by more than `threshold` gray levels on average.
    /// A moving progress bar changes well under 1 level; a different screen changes by many.
    public static func isNew(_ frame: FrameSignature, since previous: FrameSignature?, threshold: Double = 0.8) -> Bool {
        guard let previous else { return true }
        return frame.distance(to: previous) > threshold
    }
}
