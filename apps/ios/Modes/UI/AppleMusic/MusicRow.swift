import SwiftUI

struct MusicRow<Trailing: View>: View {
    let url: URL?
    let title: String
    var subtitle: String?
    var round = false
    var artwork: CGFloat?
    var chevron = false
    @ViewBuilder var trailing: Trailing
    @Environment(\.metrics) private var metrics

    var body: some View {
        let side = artwork ?? metrics.rowArtwork
        HStack(spacing: metrics.gap) {
            Artwork(url: url, radius: round ? side / 2 : side * 0.07).frame(width: side, height: side)
            VStack(alignment: .leading, spacing: 1) {
                Text(title).font(.amRowTitle).lineLimit(1)
                if let subtitle, !subtitle.isEmpty {
                    Text(subtitle).font(.amRowSubtitle).foregroundStyle(.secondary).lineLimit(1)
                }
            }
            Spacer(minLength: 0)
            if chevron { Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary) }
            trailing
        }
        .contentShape(.rect)
    }
}

extension MusicRow where Trailing == EmptyView {
    init(url: URL?, title: String, subtitle: String? = nil, round: Bool = false, artwork: CGFloat? = nil, chevron: Bool = false) {
        self.init(url: url, title: title, subtitle: subtitle, round: round, artwork: artwork, chevron: chevron) { EmptyView() }
    }
}

struct RowSeparator: ViewModifier {
    @Environment(\.metrics) private var metrics
    var leading: CGFloat?

    func body(content: Content) -> some View {
        content.overlay(alignment: .bottom) {
            Rectangle().fill(Color(.separator)).frame(height: 1 / 3).padding(.leading, leading ?? metrics.textInset)
        }
    }
}

extension View {
    func rowSeparator(leading: CGFloat? = nil) -> some View { modifier(RowSeparator(leading: leading)) }
}

struct PagedRows<Item: Identifiable, Row: View>: View {
    let items: [Item]
    var rows = 4
    @ViewBuilder var row: (Item) -> Row
    @Environment(\.metrics) private var metrics

    var body: some View {
        let pages = stride(from: 0, to: items.count, by: rows).map { Array(items[$0..<min($0 + rows, items.count)]) }
        ScrollView(.horizontal) {
            LazyHStack(alignment: .top, spacing: 0) {
                ForEach(Array(pages.enumerated()), id: \.offset) { _, page in
                    VStack(spacing: 0) {
                        ForEach(page) { item in
                            row(item).padding(.vertical, 6).rowSeparator(leading: metrics.inset + 44 * metrics.unit + metrics.gap)
                        }
                    }
                    .containerRelativeFrame(.horizontal) { length, _ in length - metrics.inset * 1.2 }
                }
            }
            .scrollTargetLayout()
        }
        .contentMargins(.leading, metrics.inset, for: .scrollContent)
        .scrollTargetBehavior(.viewAligned)
        .scrollIndicators(.hidden)
    }
}

struct HeroCard: View {
    let kicker: String?
    let title: String
    var subtitle: String?
    let url: URL?
    @Environment(\.metrics) private var metrics
    @State private var tint = Color(.systemGray3)

    var body: some View {
        let radius = metrics.cardRadius * 3
        ZStack(alignment: .bottomLeading) {
            tint
            Artwork(url: url, radius: 0).aspectRatio(contentMode: .fill)
            LinearGradient(stops: [.init(color: .clear, location: 0.35), .init(color: .black.opacity(0.72), location: 1)], startPoint: .top, endPoint: .bottom)
            VStack(alignment: .leading, spacing: 3) {
                if let kicker { Text(kicker.uppercased()).font(.caption.weight(.bold)).tracking(0.8).opacity(0.85) }
                Text(title).font(.title2.weight(.bold)).lineLimit(2)
                if let subtitle { Text(subtitle).font(.subheadline).opacity(0.85).lineLimit(1) }
            }
            .foregroundStyle(.white).padding(metrics.inset)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .aspectRatio(1.18, contentMode: .fit)
        .clipShape(.rect(cornerRadius: radius, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: radius, style: .continuous).strokeBorder(.white.opacity(0.16), lineWidth: 0.75) }
        .shadow(color: tint.opacity(0.4), radius: 20, y: 10)
        .padding(.horizontal, metrics.inset)
        .task(id: url) { if let t = await loadTint(for: url, scheme: .light) { tint = t.top } }
    }
}

func kindLine(_ kind: String, _ rest: String?) -> String {
    [kind, rest].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ")
}
