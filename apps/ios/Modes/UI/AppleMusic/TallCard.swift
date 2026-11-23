import SwiftUI
import UIKit

struct TallCard: View {
    enum Style: Hashable {
        case favorites, mix
        case artist(String)
    }

    let kicker: String
    let title: String
    let detail: String
    let style: Style
    var covers: [URL] = []
    @Environment(\.metrics) private var metrics
    @State private var palette: [Color] = []

    private static let points: [SIMD2<Float>] = [[0, 0], [0.5, 0], [1, 0], [0, 0.5], [0.62, 0.42], [1, 0.5], [0, 1], [0.5, 1], [1, 1]]

    var body: some View {
        let width = metrics.tallWidth
        ZStack {
            MeshGradient(width: 3, height: 3, points: Self.points, colors: colors)
            LinearGradient(colors: [.white.opacity(0.28), .clear], startPoint: .topLeading, endPoint: .center)
            wordmark(width)
            fan(width)
            LinearGradient(stops: [.init(color: .clear, location: 0.5), .init(color: .black.opacity(0.42), location: 1)],
                           startPoint: .top, endPoint: .bottom)
            VStack(alignment: .leading, spacing: 2) {
                Spacer(minLength: 0)
                Text(kicker.uppercased()).font(.caption2.weight(.bold)).tracking(0.8).opacity(0.85)
                Text(title).font(.title3.weight(.bold)).lineLimit(2)
                Text(detail).font(.footnote).opacity(0.85).lineLimit(2)
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(width * 0.075)
            badge(width)
        }
        .frame(width: width, height: metrics.tallHeight)
        .clipShape(.rect(cornerRadius: metrics.tallRadius, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: metrics.tallRadius, style: .continuous).strokeBorder(.white.opacity(0.18), lineWidth: 0.75) }
        .shadow(color: colors[4].opacity(0.45), radius: 22, y: 12)
        .contentShape(.rect)
        .task(id: covers.first) { await loadPalette() }
    }

    private var colors: [Color] {
        palette.count == 9 ? palette : Self.fallback(style)
    }

    private func wordmark(_ width: CGFloat) -> some View {
        let text: String
        switch style {
        case .favorites: text = ""
        case .mix: text = "New\nMusic"
        case .artist(let name): text = name
        }
        return Text(text).font(.system(size: width * (style == .mix ? 0.27 : 0.19), weight: .heavy, design: .rounded))
            .foregroundStyle(.white).minimumScaleFactor(0.4).lineLimit(3).multilineTextAlignment(.leading)
            .shadow(color: .black.opacity(0.18), radius: 8, y: 3)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(width * 0.075).padding(.top, width * 0.02)
    }

    private func fan(_ width: CGFloat) -> some View {
        let side = width * 0.5
        let urls = Array(covers.prefix(3))
        return ZStack {
            ForEach(Array(urls.enumerated().reversed()), id: \.offset) { index, url in
                Artwork(url: url, radius: side * 0.07).frame(width: side, height: side)
                    .rotationEffect(.degrees(Double(index) * 9 - 2))
                    .offset(x: CGFloat(index) * side * 0.2, y: CGFloat(index) * -side * 0.05)
                    .shadow(color: .black.opacity(0.35), radius: 10, y: 6)
                    .scaleEffect(1 - CGFloat(index) * 0.06)
            }
            if urls.isEmpty, style == .favorites {
                Image(systemName: "star.fill").font(.system(size: width * 0.34)).foregroundStyle(.white)
                    .shadow(color: .black.opacity(0.25), radius: 12, y: 6)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        .offset(x: -width * 0.04, y: width * 0.04)
    }

    @ViewBuilder private func badge(_ width: CGFloat) -> some View {
        if style == .favorites, !covers.isEmpty {
            Image(systemName: "star.fill").font(.callout.weight(.bold)).foregroundStyle(.white)
                .frame(width: width * 0.13, height: width * 0.13).glassEffect(.regular, in: .circle)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing).padding(width * 0.06)
        }
    }

    private func loadPalette() async {
        guard let url = covers.first, let image = await ImagePipeline.shared.image(for: url) else { return }
        let cells = image.gridColors()
        guard cells.count == 9 else { return }
        palette = cells.map(Self.vivid)
    }

    private static func vivid(_ color: UIColor) -> Color {
        var h: CGFloat = 0, s: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        color.getHue(&h, saturation: &s, brightness: &b, alpha: &a)
        return Color(hue: h, saturation: min(1, s * 1.3 + 0.12), brightness: min(0.92, max(0.5, b * 0.95 + 0.1)))
    }

    private static func fallback(_ style: Style) -> [Color] {
        let base: [Color]
        switch style {
        case .favorites: base = [Color(red: 1, green: 0.27, blue: 0.35), Color(red: 0.98, green: 0.45, blue: 0.3), Color(red: 0.85, green: 0.15, blue: 0.4)]
        case .mix: base = [Color(red: 1, green: 0.2, blue: 0.3), Color(red: 1, green: 0.4, blue: 0.5), Color(red: 0.9, green: 0.25, blue: 0.55)]
        case .artist(let name):
            let hue = Double(name.unicodeScalars.reduce(7) { ($0 &* 31 &+ Int($1.value)) % 360 }) / 360
            base = [Color(hue: hue, saturation: 0.75, brightness: 0.9), Color(hue: (hue + 0.07).truncatingRemainder(dividingBy: 1), saturation: 0.7, brightness: 0.8),
                    Color(hue: (hue + 0.93).truncatingRemainder(dividingBy: 1), saturation: 0.8, brightness: 0.7)]
        }
        return (0..<9).map { base[$0 % 3] }
    }
}

struct ProfileButton: View {
    @State private var showSettings = false
    @Environment(\.metrics) private var metrics

    var body: some View {
        Button { showSettings = true } label: {
            Image(systemName: "person.crop.circle.fill").resizable().scaledToFit()
                .symbolRenderingMode(.palette).foregroundStyle(.white, Color(.systemGray3))
                .frame(width: 34 * metrics.unit, height: 34 * metrics.unit)
        }
        .accessibilityLabel("Account")
        .sheet(isPresented: $showSettings) { SettingsView() }
    }
}
