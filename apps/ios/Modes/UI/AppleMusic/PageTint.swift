import SwiftUI
import UIKit

struct PageTint: Equatable {
    var top: Color
    var bottom: Color
    var dark: Bool

    static let plain = PageTint(top: Color(.systemBackground), bottom: Color(.systemBackground), dark: false)

    var foreground: Color { top == PageTint.plain.top ? .primary : (dark ? .white : .black) }

    static func from(_ image: UIImage, scheme: ColorScheme) -> PageTint {
        let cells = image.gridColors()
        guard !cells.isEmpty else { return .plain }
        var red: CGFloat = 0, green: CGFloat = 0, blue: CGFloat = 0
        for cell in cells {
            var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
            cell.getRed(&r, green: &g, blue: &b, alpha: &a)
            red += r; green += g; blue += b
        }
        let n = CGFloat(cells.count)
        let mean = UIColor(red: red / n, green: green / n, blue: blue / n, alpha: 1)
        var h: CGFloat = 0, s: CGFloat = 0, v: CGFloat = 0, a: CGFloat = 0
        mean.getHue(&h, saturation: &s, brightness: &v, alpha: &a)
        let saturation = s < 0.08 ? s : min(1, s * 1.15 + 0.05)
        let base = UIColor(hue: h, saturation: saturation, brightness: v, alpha: 1)
        var white: CGFloat = 0
        base.getWhite(&white, alpha: &a)
        let luminance = 0.299 * red / n + 0.587 * green / n + 0.114 * blue / n
        if scheme == .dark {
            let top = UIColor(hue: h, saturation: min(1, saturation * 0.9), brightness: min(0.34, max(0.16, v * 0.5)), alpha: 1)
            let bottom = UIColor(hue: h, saturation: min(1, saturation * 0.9), brightness: min(0.2, max(0.08, v * 0.3)), alpha: 1)
            return PageTint(top: Color(top), bottom: Color(bottom), dark: true)
        }
        let dark = luminance < 0.62
        let lower = UIColor(hue: h, saturation: min(1, saturation + 0.05), brightness: max(0, v * (dark ? 0.78 : 0.94)), alpha: 1)
        return PageTint(top: Color(base), bottom: Color(lower), dark: dark)
    }
}

struct TintedBackground: View {
    let tint: PageTint

    var body: some View {
        LinearGradient(colors: [tint.top, tint.bottom], startPoint: .top, endPoint: .bottom)
            .ignoresSafeArea()
            .animation(.easeInOut(duration: 0.35), value: tint)
    }
}

@MainActor
func loadTint(for url: URL?, scheme: ColorScheme) async -> PageTint? {
    guard let url, let image = await ImagePipeline.shared.image(for: url) else { return nil }
    return PageTint.from(image, scheme: scheme)
}
