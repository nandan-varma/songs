import ModesCore
import SwiftUI

struct ShelfHeader: View {
    let title: String
    var showsChevron = false
    @Environment(\.metrics) private var metrics

    var body: some View {
        HStack(spacing: 4) {
            Text(title).font(.amSection)
            if showsChevron {
                Image(systemName: "chevron.right").font(.footnote.weight(.bold)).foregroundStyle(.tertiary)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, metrics.inset)
        .accessibilityAddTraits(.isHeader)
    }
}

struct Shelf<Content: View>: View {
    let title: String
    var showsChevron = false
    @ViewBuilder var content: Content
    @Environment(\.metrics) private var metrics

    var body: some View {
        VStack(alignment: .leading, spacing: metrics.gap) {
            ShelfHeader(title: title, showsChevron: showsChevron)
            ScrollView(.horizontal) {
                LazyHStack(alignment: .top, spacing: metrics.gap) { content }
                    .scrollTargetLayout()
            }
            .contentMargins(.horizontal, metrics.inset, for: .scrollContent)
            .scrollTargetBehavior(.viewAligned)
            .scrollIndicators(.hidden)
        }
    }
}

struct TileCard: View {
    let url: URL?
    let title: String
    var subtitle: String?
    var round = false
    var explicit = false
    @Environment(\.metrics) private var metrics

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Artwork(url: url, radius: round ? metrics.card / 2 : metrics.cardRadius)
                .frame(width: metrics.card, height: metrics.card)
                .overlay { RoundedRectangle(cornerRadius: round ? metrics.card / 2 : metrics.cardRadius, style: .continuous)
                    .strokeBorder(.primary.opacity(0.06), lineWidth: 0.5) }
            Text(title).font(.amCardTitle).lineLimit(1).padding(.top, 8)
                .frame(width: metrics.card, alignment: round ? .center : .leading)
            if let subtitle, !subtitle.isEmpty {
                Text(subtitle).font(.amCardTitle).foregroundStyle(.secondary).lineLimit(1)
                    .frame(width: metrics.card, alignment: round ? .center : .leading)
            }
        }
        .frame(width: metrics.card, alignment: .top)
        .contentShape(.rect)
    }
}

struct TileLink: View {
    @Environment(AppModel.self) private var model
    let tile: SaavnAPI.Tile

    var body: some View {
        let card = TileCard(url: tile.image, title: tile.name, subtitle: tile.subtitle, round: tile.kind == .artist)
        if let route = tile.route {
            NavigationLink(value: route) { card }.buttonStyle(CardPressStyle()).zoomSource(route)
        } else if tile.kind == .radioStation {
            Button { Task { await model.playStation(tile) } } label: { card }.buttonStyle(CardPressStyle())
        } else if tile.kind == .channel {
            NavigationLink(value: MusicRoute.genre(tile)) { card }.buttonStyle(CardPressStyle()).zoomSource(MusicRoute.genre(tile))
        } else {
            card
        }
    }
}

struct CardPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .opacity(configuration.isPressed ? 0.85 : 1)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

struct ShelfSkeleton: View {
    @Environment(\.metrics) private var metrics

    var body: some View {
        VStack(alignment: .leading, spacing: metrics.gap) {
            RoundedRectangle(cornerRadius: 6).fill(.quaternary).frame(width: metrics.width * 0.4, height: 22)
                .padding(.horizontal, metrics.inset)
            HStack(spacing: metrics.gap) {
                ForEach(0..<3, id: \.self) { _ in
                    VStack(alignment: .leading, spacing: 8) {
                        RoundedRectangle(cornerRadius: metrics.cardRadius).fill(.quaternary).frame(width: metrics.card, height: metrics.card)
                        RoundedRectangle(cornerRadius: 4).fill(.quaternary).frame(width: metrics.card * 0.8, height: 14)
                    }
                }
            }
            .padding(.horizontal, metrics.inset)
        }
        .redacted(reason: .placeholder)
        .accessibilityHidden(true)
    }
}

struct RowPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background(configuration.isPressed ? Color(.systemGray5).opacity(0.7) : .clear)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}
