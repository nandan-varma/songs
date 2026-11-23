import ModesCore
import SwiftUI

struct RadioView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.metrics) private var metrics
    @Namespace private var zoom

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: metrics.shelfSpacing) {
                    if let launch = model.launch {
                        let stations = launch.shelf("radio")?.items ?? []
                        let artists = launch.shelf("artist_recos")?.items ?? []
                        if let live = stations.first { onAir(live) }
                        if stations.count > 1 {
                            Shelf(title: "Stations for You") { ForEach(stations.dropFirst()) { TileLink(tile: $0) } }
                        }
                        if !artists.isEmpty { artistTakeOver(artists) }
                        if let genres = Optional(launch.genres), !genres.isEmpty {
                            Shelf(title: "Moods & Genres") { ForEach(genres) { TileLink(tile: $0) } }
                        }
                    } else if model.launchFailed {
                        LoadFailedView { Task { await model.loadLaunch(force: true) } }
                    } else {
                        ShelfSkeleton(); ShelfSkeleton()
                    }
                }
                .padding(.top, 4)
                .padding(.bottom, 160)
            }
            .scrollIndicators(.hidden)
            .navigationTitle("Radio")
            .toolbar { ToolbarItem(placement: .topBarTrailing) { ProfileButton() } }
            .task(id: model.settings.languages) { await model.loadLaunch() }
            .animation(.easeOut(duration: 0.35), value: model.launch != nil)
            .refreshable { await model.loadLaunch(force: true) }
            .environment(\.zoomNamespace, zoom)
            .musicRoutes()
        }
    }

    private func onAir(_ tile: SaavnAPI.Tile) -> some View {
        VStack(alignment: .leading, spacing: metrics.gap) {
            ShelfHeader(title: "On Air Now")
            Button { Task { await model.playStation(tile) } } label: {
                ZStack(alignment: .bottomLeading) {
                    Artwork(url: tile.image, radius: metrics.cardRadius * 2)
                        .aspectRatio(1.2, contentMode: .fill).frame(maxWidth: .infinity)
                    LinearGradient(colors: [.clear, .black.opacity(0.65)], startPoint: .center, endPoint: .bottom)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(tile.subtitle ?? "Radio").font(.caption.weight(.semibold)).opacity(0.85)
                        Text(tile.name).font(.title3.weight(.bold))
                    }
                    .foregroundStyle(.white).padding(metrics.inset)
                }
                .clipShape(.rect(cornerRadius: metrics.cardRadius * 2, style: .continuous))
                .padding(.horizontal, metrics.inset)
            }
            .buttonStyle(CardPressStyle())
        }
    }

    private func artistTakeOver(_ artists: [SaavnAPI.Tile]) -> some View {
        VStack(alignment: .leading, spacing: metrics.gap) {
            ShelfHeader(title: "Artists Take Over", showsChevron: true)
            PagedRows(items: artists, rows: 3) { tile in
                Button { Task { await model.playStation(tile) } } label: {
                    MusicRow(url: tile.image, title: tile.name, subtitle: tile.subtitle ?? "Radio Station", artwork: 52 * metrics.unit) {
                        Image(systemName: "ellipsis").foregroundStyle(.secondary)
                    }
                }
                .buttonStyle(.plain)
            }
        }
    }
}
