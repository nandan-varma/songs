import ModesCore
import SwiftUI

extension UIImage {
    private static let colorContext = CIContext(options: [.workingColorSpace: NSNull()])

    var averageColor: UIColor? {
        guard let input = CIImage(image: self), let filter = CIFilter(name: "CIAreaAverage", parameters: [kCIInputImageKey: input, kCIInputExtentKey: CIVector(cgRect: input.extent)]),
              let output = filter.outputImage else { return nil }
        var px = [UInt8](repeating: 0, count: 4)
        Self.colorContext.render(output, toBitmap: &px, rowBytes: 4, bounds: CGRect(x: 0, y: 0, width: 1, height: 1), format: .RGBA8, colorSpace: nil)
        return UIColor(red: CGFloat(px[0]) / 255, green: CGFloat(px[1]) / 255, blue: CGFloat(px[2]) / 255, alpha: 1)
    }

    static func playerTint(from color: UIColor) -> Color {
        var h: CGFloat = 0, s: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        color.getHue(&h, saturation: &s, brightness: &b, alpha: &a)
        let calm = PlayerTint.calm(hue: Double(h), saturation: Double(s), brightness: Double(b))
        return Color(hue: calm.hue, saturation: calm.saturation, brightness: calm.brightness)
    }
}
