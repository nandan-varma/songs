import SwiftUI

enum PlaylistCover {
    static let palettes: [[Color]] = [
        [Color(red: 0.99, green: 0.62, blue: 0.3), Color(red: 0.78, green: 0.25, blue: 0.12), Color(red: 0.32, green: 0.1, blue: 0.08)],
        [Color(red: 1, green: 0.55, blue: 0.7), Color(red: 0.62, green: 0.25, blue: 0.85), Color(red: 0.2, green: 0.1, blue: 0.5)],
        [Color(red: 0.35, green: 0.9, blue: 0.85), Color(red: 0.1, green: 0.5, blue: 0.85), Color(red: 0.05, green: 0.15, blue: 0.45)],
        [Color(red: 0.7, green: 0.95, blue: 0.5), Color(red: 0.2, green: 0.65, blue: 0.4), Color(red: 0.05, green: 0.25, blue: 0.2)],
        [Color(red: 1, green: 0.4, blue: 0.4), Color(red: 0.75, green: 0.1, blue: 0.2), Color(red: 0.15, green: 0.02, blue: 0.08)],
        [Color(red: 0.6, green: 0.7, blue: 1), Color(red: 0.35, green: 0.3, blue: 0.9), Color(red: 0.08, green: 0.08, blue: 0.35)],
        [Color(red: 1, green: 0.9, blue: 0.4), Color(red: 0.98, green: 0.6, blue: 0.15), Color(red: 0.55, green: 0.2, blue: 0.05)],
        [Color(red: 0.75, green: 0.75, blue: 0.8), Color(red: 0.35, green: 0.35, blue: 0.42), Color(red: 0.08, green: 0.08, blue: 0.12)],
    ]
}

struct PlaylistCoverView: View {
    let style: Int
    var title: String?
    var radius: CGFloat = 8

    var body: some View {
        let palette = PlaylistCover.palettes[abs(style) % PlaylistCover.palettes.count]
        GeometryReader { proxy in
            ZStack(alignment: .topLeading) {
                LinearGradient(colors: palette, startPoint: .topLeading, endPoint: .bottomTrailing)
                RadialGradient(colors: [.white.opacity(0.45), .clear], center: UnitPoint(x: 0.3, y: 0.25), startRadius: 0, endRadius: proxy.size.width * 0.8)
                    .blendMode(.softLight)
                Image(systemName: "music.note").font(.system(size: proxy.size.width * 0.34, weight: .bold)).foregroundStyle(.white.opacity(0.28))
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing).padding(proxy.size.width * 0.08)
                if let title, !title.isEmpty {
                    Text(title).font(.system(size: proxy.size.width * 0.1, weight: .bold)).foregroundStyle(.white).lineLimit(2)
                        .padding(proxy.size.width * 0.08)
                }
            }
        }
        .aspectRatio(1, contentMode: .fit)
        .clipShape(.rect(cornerRadius: radius, style: .continuous))
    }
}
