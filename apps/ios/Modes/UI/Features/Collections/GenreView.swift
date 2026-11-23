import ModesCore
import SwiftUI

struct GenreView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.metrics) private var metrics
    let tile: SaavnAPI.Tile
    @State private var playlists: [SaavnAPI.Playlist] = []
    @State private var songs: [SaavnAPI.Hit] = []
    @State private var loaded = false
    @State private var tint = PageTint.plain
    @Environment(\.colorScheme) private var scheme

    private var header: some View {
        HStack(alignment: .bottom, spacing: metrics.gap) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Genres & Moods").font(.footnote.weight(.semibold)).textCase(.uppercase).tracking(0.8).foregroundStyle(.secondary)
                Text(tile.name).font(.system(size: metrics.width * 0.105, weight: .heavy, design: .rounded)).lineLimit(2).minimumScaleFactor(0.6)
            }
            Spacer(minLength: 0)
            Button { playAll() } label: {
                Image(systemName: "play.fill").font(.title2).foregroundStyle(.white).frame(width: 60 * metrics.unit, height: 60 * metrics.unit)
                    .background(Color.accentColor.gradient, in: .circle).shadow(color: Color.accentColor.opacity(0.4), radius: 12, y: 6)
            }
            .buttonStyle(CardPressStyle()).disabled(songs.isEmpty).opacity(songs.isEmpty ? 0.4 : 1)
        }
        .padding(.horizontal, metrics.inset).padding(.top, 8)
    }

    private func playAll() {
        guard let first = songs.first else { return }
        model.playSong(.hit(first), in: songs.map { .hit($0) })
    }

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: metrics.shelfSpacing) {
                header
                if !playlists.isEmpty {
                    Shelf(title: "Playlists") {
                        ForEach(playlists) { playlist in
                            ZoomLink(route: MusicRoute.playlist(playlist.id)) {
                                TileCard(url: playlist.image, title: playlist.name, subtitle: playlist.subtitle)
                            }
                            .buttonStyle(CardPressStyle())
                        }
                    }
                }
                if !songs.isEmpty {
                    let context = songs.map { SongReference.hit($0) }
                    VStack(alignment: .leading, spacing: metrics.gap) {
                        ShelfHeader(title: "Songs")
                        ForEach(songs) { hit in
                            let display = model.display(title: hit.song.title, artist: hit.song.artist, album: hit.song.album)
                            Button { model.playSong(.hit(hit), in: context) } label: {
                                MusicRow(url: hit.song.image, title: display.title, subtitle: display.compactArtist) {
                                    Image(systemName: "ellipsis").foregroundStyle(.secondary)
                                }
                                .padding(.horizontal, metrics.inset).padding(.vertical, 4).rowSeparator()
                            }
                            .buttonStyle(RowPressStyle())
                        }
                    }
                }
                if loaded && playlists.isEmpty && songs.isEmpty {
                    ContentUnavailableView("Nothing here yet", systemImage: "music.note")
                }
            }
            .padding(.bottom, 160)
        }
        .background(alignment: .top) {
            LinearGradient(colors: [tint.top.opacity(0.9), tint.top.opacity(0)], startPoint: .top, endPoint: .bottom)
                .frame(height: 380).ignoresSafeArea(edges: .top)
        }
        .navigationBarTitleDisplayMode(.inline)
        .task(id: tile.image) { if let t = await loadTint(for: tile.image, scheme: scheme) { tint = t } }
        .task(id: tile.id) {
            let language = model.settings.languages.first ?? ""
            let query = "\(tile.name) \(language)"
            async let found = try? SaavnAPI.searchPlaylists(query, page: 0, delivery: model.delivery).items
            async let hits = try? SaavnAPI.searchSongs(query, page: 0, delivery: model.delivery).items
            playlists = await found ?? []
            songs = await hits ?? []
            loaded = true
        }
    }
}
