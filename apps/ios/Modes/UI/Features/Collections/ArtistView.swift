import ModesCore
import SwiftUI

struct ArtistView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.metrics) private var metrics
    let id: String

    @State private var artist: SaavnAPI.Artist?
    @State private var failed = false
    @State private var tint = PageTint.plain
    @State private var saved = false

    var body: some View {
        ZStack {
            TintedBackground(tint: tint).ignoresSafeArea()
            if let artist {
                ScrollView {
                    VStack(alignment: .leading, spacing: metrics.shelfSpacing) {
                        hero(artist)
                        if let latest = latestRelease(artist) { latestCard(latest) }
                        if !artist.songs.isEmpty { topSongs(artist) }
                        if !artist.albums.isEmpty { albums(artist) }
                    }
                    .padding(.bottom, 160)
                }
                .scrollIndicators(.hidden)
                .ignoresSafeArea(edges: .top)
            } else if failed {
                LoadFailedView { Task { await load() } }
            } else {
                ProgressView().controlSize(.large)
            }
        }
        .environment(\.colorScheme, .dark)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbarBackground(.hidden, for: .navigationBar)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if let artist, let url = PlayerMenuItems.searchURL(title: artist.name, artist: "") {
                ToolbarItem(placement: .topBarTrailing) { ShareLink(item: url) }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Menu("More", systemImage: "ellipsis") {
                    if let artist {
                        Button("Play next", systemImage: "text.line.first.and.arrowtriangle.forward") { artist.songs.reversed().forEach { model.queueSongNext(.hit($0)) } }
                        Button("Play last", systemImage: "text.line.last.and.arrowtriangle.forward") { artist.songs.forEach { model.queueSongLast(.hit($0)) } }
                    }
                }
            }
        }
        .task(id: id) { await load() }
        .task(id: artist?.image) { if let t = await loadTint(for: artist?.image, scheme: .dark) { tint = t } }
    }

    private func hero(_ artist: SaavnAPI.Artist) -> some View {
        let height = metrics.width * 1.12
        return VStack(spacing: 18 * metrics.unit) {
            ZStack(alignment: .bottom) {
                Artwork(url: artist.image, radius: 0).aspectRatio(contentMode: .fill)
                    .frame(width: metrics.width, height: height).clipped()
                LinearGradient(stops: [.init(color: .clear, location: 0.45), .init(color: tint.bottom.opacity(0.75), location: 0.8),
                                       .init(color: tint.bottom, location: 1)], startPoint: .top, endPoint: .bottom)
                Text(artist.name).font(.system(size: metrics.width * 0.115, weight: .bold)).multilineTextAlignment(.center)
                    .minimumScaleFactor(0.55).lineLimit(2).padding(.horizontal, metrics.inset)
                    .shadow(color: .black.opacity(0.4), radius: 12, y: 2).padding(.bottom, 4)
            }
            .frame(width: metrics.width, height: height)
            controls(artist)
        }
    }

    private func controls(_ artist: SaavnAPI.Artist) -> some View {
        let side = 54 * metrics.unit
        let play = 82 * metrics.unit
        return HStack(spacing: 28 * metrics.unit) {
            Button { shuffle(artist) } label: {
                Image(systemName: "shuffle").font(.title3.weight(.semibold)).frame(width: side, height: side)
                    .glassEffect(.regular.interactive(), in: .circle)
            }
            Button { playAll(artist) } label: {
                Image(systemName: "play.fill").font(.system(size: play * 0.4)).foregroundStyle(.black)
                    .frame(width: play, height: play).background(.white, in: .circle)
                    .shadow(color: .black.opacity(0.3), radius: 14, y: 6)
            }
            Button { startStation(artist) } label: {
                Image(systemName: "dot.radiowaves.left.and.right").font(.title3.weight(.semibold)).frame(width: side, height: side)
                    .glassEffect(.regular.interactive(), in: .circle)
            }
        }
        .buttonStyle(CardPressStyle())
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .contain)
    }

    private func latestRelease(_ artist: SaavnAPI.Artist) -> SaavnAPI.Album? {
        artist.albums.max { ($0.songs.first?.song.year ?? 0) < ($1.songs.first?.song.year ?? 0) }
    }

    private func latestCard(_ album: SaavnAPI.Album) -> some View {
        let year = album.songs.first.map { $0.song.year > 0 ? String($0.song.year) : "" } ?? ""
        return ZoomLink(route: MusicRoute.album(album.id)) {
            HStack(spacing: metrics.gap + 4) {
                Artwork(url: album.image, radius: 8).frame(width: 86 * metrics.unit, height: 86 * metrics.unit)
                VStack(alignment: .leading, spacing: 3) {
                    Text(["Latest Release", year].filter { !$0.isEmpty }.joined(separator: " · ")).font(.subheadline).foregroundStyle(.secondary)
                    Text(album.name).font(.body.weight(.semibold)).lineLimit(2).multilineTextAlignment(.leading)
                    Text("\(album.songs.count) Songs").font(.subheadline).foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
                Button { saveAlbum(album) } label: {
                    Image(systemName: saved ? "checkmark" : "plus").font(.body.weight(.bold)).frame(width: 40 * metrics.unit, height: 40 * metrics.unit)
                        .glassEffect(.regular.interactive(), in: .circle)
                }
                .buttonStyle(.plain)
            }
            .padding(14 * metrics.unit)
            .glassEffect(.regular, in: .rect(cornerRadius: 26 * metrics.unit, style: .continuous))
            .padding(.horizontal, metrics.inset)
        }
        .buttonStyle(CardPressStyle())
    }

    private func topSongs(_ artist: SaavnAPI.Artist) -> some View {
        let hits = Array(artist.songs.prefix(10))
        let context = hits.map { SongReference.hit($0) }
        return VStack(alignment: .leading, spacing: 4) {
            ShelfHeader(title: "Top Songs", showsChevron: true).padding(.bottom, 8)
            ForEach(hits) { hit in
                let display = model.display(title: hit.song.title, artist: hit.song.artist, album: hit.song.album)
                Button { model.playSong(.hit(hit), in: context) } label: {
                    MusicRow(url: hit.song.image, title: display.title, subtitle: hit.song.album, artwork: 48 * metrics.unit) {
                        Image(systemName: "ellipsis").foregroundStyle(.secondary).frame(width: 36, height: 36)
                    }
                    .padding(.horizontal, metrics.inset).padding(.vertical, 6)
                    .rowSeparator(leading: metrics.inset + 48 * metrics.unit + metrics.gap)
                }
                .buttonStyle(RowPressStyle())
            }
        }
    }

    private func albums(_ artist: SaavnAPI.Artist) -> some View {
        Shelf(title: "Albums", showsChevron: true) {
            ForEach(artist.albums) { album in
                ZoomLink(route: MusicRoute.album(album.id)) {
                    TileCard(url: album.image, title: album.name, subtitle: album.songs.first.map { $0.song.year > 0 ? String($0.song.year) : "" })
                }
                .buttonStyle(CardPressStyle())
            }
        }
    }

    private func playAll(_ artist: SaavnAPI.Artist) {
        guard let first = artist.songs.first else { return }
        model.playSong(.hit(first), in: artist.songs.map { .hit($0) })
    }

    private func shuffle(_ artist: SaavnAPI.Artist) {
        let all = artist.songs.shuffled()
        guard let first = all.first else { return }
        model.playSong(.hit(first), in: all.map { .hit($0) })
    }

    private func startStation(_ artist: SaavnAPI.Artist) {
        let tile = SaavnAPI.Tile(id: artist.id, kind: .radioStation, name: "\(artist.name) Radio", subtitle: nil, image: artist.image,
                                 language: nil, color: nil, stationKind: "artist", stationQuery: artist.name)
        Task { await model.playStation(tile) }
    }

    private func saveAlbum(_ album: SaavnAPI.Album) {
        guard !saved else { return }
        saved = true
        let playlist = model.createPlaylist(named: album.name)
        album.songs.forEach { model.addToPlaylist(.hit($0), playlistID: playlist) }
    }

    private func load() async {
        failed = false
        do { artist = try await SaavnAPI.artist(id: id, delivery: model.delivery) } catch { failed = true }
    }
}
