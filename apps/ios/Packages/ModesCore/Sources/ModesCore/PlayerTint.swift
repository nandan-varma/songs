import Foundation

public struct TintComponents: Equatable, Sendable {
    public var hue: Double
    public var saturation: Double
    public var brightness: Double
}

public enum PlayerTint {
    public static let maximumLuminance = 0.18

    public static func calm(hue: Double, saturation: Double, brightness: Double) -> TintComponents {
        let tinted = saturation < 0.1 ? saturation : min(max(saturation, 0.35), 0.7)
        var result = TintComponents(hue: hue, saturation: tinted, brightness: min(max(brightness, 0.35), 0.62))
        while luminance(result) > maximumLuminance, result.brightness > 0.1 { result.brightness -= 0.02 }
        return result
    }

    public static func luminance(_ tint: TintComponents) -> Double {
        let (r, g, b) = rgb(tint)
        func linear(_ value: Double) -> Double { value <= 0.03928 ? value / 12.92 : pow((value + 0.055) / 1.055, 2.4) }
        return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
    }

    private static func rgb(_ tint: TintComponents) -> (Double, Double, Double) {
        let hue = (tint.hue - tint.hue.rounded(.down)) * 6
        let sector = Int(hue)
        let fraction = hue - Double(sector)
        let p = tint.brightness * (1 - tint.saturation)
        let q = tint.brightness * (1 - tint.saturation * fraction)
        let t = tint.brightness * (1 - tint.saturation * (1 - fraction))
        let v = tint.brightness
        switch sector {
        case 0: return (v, t, p)
        case 1: return (q, v, p)
        case 2: return (p, v, t)
        case 3: return (p, q, v)
        case 4: return (t, p, v)
        default: return (v, p, q)
        }
    }
}
