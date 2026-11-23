import ModesCore
import SwiftUI

struct SearchBrowseView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.metrics) private var metrics
    @State private var charts: [SaavnAPI.Chart] = []

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: metrics.shelfSpacing) {
                if let launch = model.launch {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: metrics.gap), count: columns), spacing: metrics.gap) {
                        ForEach(launch.genres) { tile in
                            ZoomLink(route: MusicRoute.genre(tile)) { GenreTileView(tile: tile) }.buttonStyle(CardPressStyle())
                        }
                    }
                    .padding(.horizontal, metrics.inset)
                    if !charts.isEmpty {
                        Shelf(title: "Charts", showsChevron: true) {
                            ForEach(charts) { chart in
                                ZoomLink(route: MusicRoute.chart(chart.id)) {
                                    TileCard(url: chart.image, title: chart.name, subtitle: chart.songCount.map { "\($0) songs" })
                                }
                                .buttonStyle(CardPressStyle())
                            }
                        }
                    }
                } else if model.launchFailed {
                    LoadFailedView { Task { await model.loadLaunch(force: true) } }
                } else {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: metrics.gap), count: columns), spacing: metrics.gap) {
                        ForEach(0..<10, id: \.self) { _ in
                            RoundedRectangle(cornerRadius: metrics.cardRadius, style: .continuous).fill(.quaternary).aspectRatio(1.75, contentMode: .fit)
                        }
                    }
                    .padding(.horizontal, metrics.inset)
                }
            }
            .padding(.top, 4)
            .padding(.bottom, 160)
        }
        .scrollIndicators(.hidden)
        .background(Color(.systemBackground))
        .task(id: model.settings.languages) { await model.loadLaunch() }
        .task(id: "charts") {
            charts = (try? await SaavnAPI.charts(delivery: model.delivery)) ?? []
            ImagePipeline.shared.prefetch(charts.compactMap(\.image))
        }
    }

    private var columns: Int { metrics.width > 700 ? 4 : 2 }
}

struct GenreTileView: View {
    let tile: SaavnAPI.Tile
    @Environment(\.metrics) private var metrics
    @State private var color = Color(.systemGray3)

    var body: some View {
        Color.clear
            .aspectRatio(1.75, contentMode: .fit)
            .overlay(alignment: .topLeading) { color }
            .overlay(alignment: .bottomTrailing) {
                GeometryReader { proxy in
                    Artwork(url: tile.image, radius: proxy.size.height * 0.07)
                        .frame(width: proxy.size.height * 0.62, height: proxy.size.height * 0.62)
                        .rotationEffect(.degrees(24))
                        .shadow(color: .black.opacity(0.25), radius: 5, y: 3)
                        .position(x: proxy.size.width - proxy.size.height * 0.22, y: proxy.size.height * 0.68)
                }
            }
            .overlay(alignment: .bottomLeading) {
                Text(tile.name).font(.body.weight(.semibold)).foregroundStyle(.white).lineLimit(2)
                    .padding(metrics.gap * 0.8)
            }
            .clipShape(.rect(cornerRadius: metrics.cardRadius, style: .continuous))
            .task(id: tile.image) {
                if let c = await loadTint(for: tile.image, scheme: .light) { color = c.top }
            }
    }
}
