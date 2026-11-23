import ModesCore
import SwiftUI

struct NewView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.metrics) private var metrics
    @Namespace private var zoom
    @State private var trending: [SaavnAPI.Hit] = []

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: metrics.shelfSpacing) {
                    if let launch = model.launch {
                        if let hero = launch.shelf("top_playlists")?.items.first, let route = hero.route {
                            NavigationLink(value: route) {
                                HeroCard(kicker: "From the editors", title: hero.name, subtitle: hero.subtitle, url: hero.image)
                            }
                            .buttonStyle(CardPressStyle())
                        }
                        if !trending.isEmpty { bestNewSongs }
                        if let shelf = launch.shelf("new_albums") { Shelf(title: shelf.title, showsChevron: true) { ForEach(shelf.items) { TileLink(tile: $0) } } }
                        if let shelf = launch.shelf("charts") { Shelf(title: shelf.title, showsChevron: true) { ForEach(shelf.items) { TileLink(tile: $0) } } }
                        ForEach(launch.shelves.filter(Self.extraKeys)) { shelf in
                            Shelf(title: shelf.title) { ForEach(shelf.items) { TileLink(tile: $0) } }
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
            .navigationTitle("New")
            .toolbar { ToolbarItem(placement: .topBarTrailing) { ProfileButton() } }
            .task(id: model.settings.languages) {
                await model.loadLaunch()
                trending = (try? await SaavnAPI.trending(language: model.settings.languages.first ?? "hindi", delivery: model.delivery)) ?? []
            }
            .animation(.easeOut(duration: 0.35), value: model.launch != nil)
            .refreshable { await model.loadLaunch(force: true) }
            .environment(\.zoomNamespace, zoom)
            .musicRoutes()
        }
    }

    private var bestNewSongs: some View {
        let hits = Array(trending.prefix(16))
        let context = hits.map { SongReference.hit($0) }
        return VStack(alignment: .leading, spacing: metrics.gap) {
            ShelfHeader(title: "Best New Songs", showsChevron: true)
            PagedRows(items: hits) { hit in
                let display = model.display(title: hit.song.title, artist: hit.song.artist, album: hit.song.album)
                Button { model.playSong(.hit(hit), in: context) } label: {
                    MusicRow(url: hit.song.image, title: display.title, subtitle: display.compactArtist, artwork: 44 * metrics.unit) {
                        Image(systemName: "ellipsis").font(.body).foregroundStyle(.secondary)
                    }
                }
                .buttonStyle(RowPressStyle())
            }
        }
    }

    static func extraKeys(_ shelf: SaavnAPI.Shelf) -> Bool {
        shelf.key.hasPrefix("promo") && !shelf.title.localizedCaseInsensitiveContains("podcast")
    }
}
