import ModesCore
import SwiftUI

extension UIImage {
    private static let gridSide = 24

    func gridColors() -> [UIColor] {
        let side = Self.gridSide
        var pixels = [UInt8](repeating: 0, count: side * side * 4)
        let drawn = pixels.withUnsafeMutableBytes { buffer -> Bool in
            guard let context = CGContext(data: buffer.baseAddress, width: side, height: side, bitsPerComponent: 8,
                                          bytesPerRow: side * 4, space: CGColorSpaceCreateDeviceRGB(),
                                          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue),
                  let image = cgImage else { return false }
            context.interpolationQuality = .high
            context.draw(image, in: CGRect(x: 0, y: 0, width: side, height: side))
            return true
        }
        guard drawn else { return [] }
        let cell = side / 3
        return (0..<9).map { index in
            let originX = (index % 3) * cell, originY = (index / 3) * cell
            var sum = [Int](repeating: 0, count: 3)
            for y in originY..<originY + cell {
                for x in originX..<originX + cell {
                    let offset = (y * side + x) * 4
                    for channel in 0..<3 { sum[channel] += Int(pixels[offset + channel]) }
                }
            }
            let count = CGFloat(cell * cell * 255)
            return UIColor(red: CGFloat(sum[0]) / count, green: CGFloat(sum[1]) / count, blue: CGFloat(sum[2]) / count, alpha: 1)
        }
    }

    static func playerTint(from color: UIColor) -> Color {
        var h: CGFloat = 0, s: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        color.getHue(&h, saturation: &s, brightness: &b, alpha: &a)
        let muted = PlayerTint.calm(hue: Double(h), saturation: Double(s), brightness: Double(b))
        return Color(hue: muted.hue, saturation: muted.saturation, brightness: muted.brightness)
    }
}
