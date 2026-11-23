import ModesCore
import SwiftUI

enum MusicRoute: Hashable {
    case album(String)
    case playlist(String)
    case artist(String)
    case chart(String)
    case genre(SaavnAPI.Tile)
    case favorites
    case forYou
    case recents
}

struct SearchRoute: Hashable {
    let scope: SearchScope
    let query: String
}

extension View {
    func musicRoutes() -> some View {
        navigationDestination(for: MusicRoute.self) { route in
            Group {
                switch route {
                case .genre(let tile): GenreView(tile: tile)
                case .artist(let id): ArtistView(id: id)
                default: CollectionView(route: route)
                }
            }
            .zoomDestination(route)
        }
        .navigationDestination(for: SearchRoute.self) {
            SearchResultsList(scope: $0.scope, query: $0.query).navigationTitle($0.scope.title)
        }
    }
}

struct LinkRow<Route: Hashable>: View {
    let route: Route
    let imageURL: URL?
    let title: String
    let subtitle: String
    var round = false
    @Environment(\.metrics) private var metrics

    var body: some View {
        ZStack {
            MusicRow(url: imageURL, title: title, subtitle: subtitle, round: round, chevron: true)
            NavigationLink(value: route) { EmptyView() }.opacity(0)
        }
        .zoomSource(route)
        .padding(.vertical, 6)
        .listRowBackground(Color.clear)
        .listRowSeparator(.hidden)
        .listRowInsets(EdgeInsets(top: 0, leading: metrics.inset, bottom: 0, trailing: metrics.inset))
        .overlay(alignment: .bottom) {
            Rectangle().fill(Color(.separator).opacity(0.6)).frame(height: 1 / 3).padding(.leading, metrics.rowArtwork + metrics.gap)
        }
    }
}

struct CollectionDetail {
    var title: String
    var artist: String
    var meta: String
    var imageURL: URL?
    var songs: [SongReference]
    var note: String?
    var footer: [String] = []
    var saveName: String?
}

struct CollectionView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.metrics) private var metrics
    @Environment(\.colorScheme) private var scheme
    let route: MusicRoute

    @State private var detail: CollectionDetail?
    @State private var tint = PageTint.plain
    @State private var failed = false
    @State private var saved = false

    var body: some View {
        ZStack {
            TintedBackground(tint: tint)
            if let detail {
                List {
                    header(detail).listRowInsets(EdgeInsets()).listRowBackground(Color.clear).listRowSeparator(.hidden)
                    ForEach(Array(detail.songs.enumerated()), id: \.offset) { index, source in
                        SongListRow(source: source, context: detail.songs, number: index + 1, style: .track)
                    }
                    footer(detail).listRowInsets(EdgeInsets(top: 18, leading: metrics.inset, bottom: 140, trailing: metrics.inset))
                        .listRowBackground(Color.clear).listRowSeparator(.hidden)
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
                .foregroundStyle(tint.foreground)
            } else if failed {
                LoadFailedView { Task { await load() } }
            } else {
                ProgressView().controlSize(.large)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.hidden, for: .navigationBar)
        .toolbar {
            if let detail, let url = PlayerMenuItems.searchURL(title: detail.title, artist: detail.artist) {
                ToolbarItem(placement: .topBarTrailing) { ShareLink(item: url) }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Menu("More", systemImage: "ellipsis") {
                    if let detail {
                        Button("Play next", systemImage: "text.line.first.and.arrowtriangle.forward") { detail.songs.reversed().forEach { model.queueSongNext($0) } }
                        Button("Play last", systemImage: "text.line.last.and.arrowtriangle.forward") { detail.songs.forEach { model.queueSongLast($0) } }
                    }
                }
            }
        }
        .tint(tint.foreground)
        .task(id: route) { await load() }
        .task(id: detail?.imageURL) { if let t = await loadTint(for: detail?.imageURL, scheme: scheme) { tint = t } }
        .onChange(of: scheme) { _, _ in Task { if let t = await loadTint(for: detail?.imageURL, scheme: scheme) { tint = t } } }
    }

    private func header(_ detail: CollectionDetail) -> some View {
        let side = metrics.heroArtwork
        return VStack(spacing: 0) {
            Artwork(url: detail.imageURL, radius: side * 0.035)
                .frame(width: side, height: side)
                .shadow(color: .black.opacity(0.28), radius: 20, y: 10)
                .padding(.top, 4)
            Text(detail.title).font(.title2.weight(.bold)).multilineTextAlignment(.center)
                .padding(.top, 22).padding(.horizontal, metrics.inset)
            if !detail.artist.isEmpty {
                Text(detail.artist).font(.title3).opacity(0.92).multilineTextAlignment(.center).padding(.horizontal, metrics.inset).padding(.top, 2)
            }
            if !detail.meta.isEmpty { Text(detail.meta).font(.caption2).opacity(0.7).padding(.top, 6) }
            controls(detail).padding(.top, 18)
            if let note = detail.note, !note.isEmpty {
                ExpandableNote(text: note, background: tint.top)
                    .padding(.horizontal, metrics.inset).padding(.top, 16).frame(maxWidth: .infinity, alignment: .leading)
            }
            Rectangle().fill(.clear).frame(height: 8)
        }
        .frame(maxWidth: .infinity)
    }

    private func controls(_ detail: CollectionDetail) -> some View {
        let height = 46 * metrics.unit
        let fill = tint.dark ? Color.white : Color.black
        let label = tint.dark ? Color.black : Color.white
        return HStack(spacing: 14) {
            Button { model.playSong(detail.songs.randomElement() ?? detail.songs[0], in: detail.songs.shuffled()) } label: {
                Image(systemName: "shuffle").font(.body.weight(.semibold)).frame(width: height, height: height)
                    .background(tint.foreground.opacity(0.18), in: .circle)
            }
            Button { if let first = detail.songs.first { model.playSong(first, in: detail.songs) } } label: {
                Label("Play", systemImage: "play.fill").font(.body.weight(.semibold)).foregroundStyle(label)
                    .frame(width: metrics.heroArtwork * 0.58, height: height).background(fill, in: .capsule)
            }
            Button { save(detail) } label: {
                Image(systemName: saved ? "checkmark" : "plus").font(.body.weight(.semibold)).frame(width: height, height: height)
                    .background(tint.foreground.opacity(0.18), in: .circle)
            }
        }
        .buttonStyle(.plain).disabled(detail.songs.isEmpty)
    }

    private func footer(_ detail: CollectionDetail) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            ForEach(detail.footer, id: \.self) { Text($0) }
        }
        .font(.footnote).opacity(0.65).frame(maxWidth: .infinity, alignment: .leading)
    }

    private func save(_ detail: CollectionDetail) {
        guard !saved else { return }
        saved = true
        let id = model.createPlaylist(named: detail.saveName ?? detail.title)
        detail.songs.forEach { model.addToPlaylist($0, playlistID: id) }
        model.flash("Added to Library")
    }

    private func load() async {
        failed = false
        do {
            switch route {
            case .album(let id):
                let album = try await SaavnAPI.album(id: id, delivery: model.delivery)
                detail = describe(title: album.name, artist: album.subtitle ?? "", image: album.image, hits: album.songs, kind: "Album")
            case .playlist(let id):
                let playlist = try await SaavnAPI.playlist(id: id, delivery: model.delivery)
                detail = describe(title: playlist.name, artist: "", image: playlist.image, hits: playlist.songs, kind: "Playlist", note: playlist.subtitle)
            case .chart(let id):
                let chart = try await SaavnAPI.chart(id: id, delivery: model.delivery)
                detail = describe(title: chart.name, artist: "", image: chart.image, hits: chart.songs, kind: "Chart")
            case .favorites:
                let items = model.favoriteItems
                detail = CollectionDetail(title: "Favorite Songs", artist: "You", meta: "Updated \(items.first?.addedAt.relativeLabel ?? "just now")",
                                          imageURL: items.first?.imageURL, songs: items.map { .library($0) }, footer: ["\(items.count) songs"])
            case .recents:
                let items = model.recentItems
                detail = CollectionDetail(title: "Recently Played", artist: "You", meta: "", imageURL: items.first?.imageURL,
                                          songs: items.map { .library($0) }, footer: ["\(items.count) songs"])
            case .forYou:
                let items = model.homeSlate
                detail = CollectionDetail(title: "New Music Mix", artist: "Made for You", meta: "Updated today",
                                          imageURL: items.first.flatMap { model.artURL($0) }, songs: items.map { .queued($0) },
                                          note: "Fresh songs picked from what you play. Refreshed as your taste changes.", footer: ["\(items.count) songs"])
            case .artist, .genre:
                break
            }
            if let detail { ImagePipeline.shared.prefetch([detail.imageURL].compactMap { $0 }) }
        } catch {
            detail = nil
            failed = true
        }
    }

    private func describe(title: String, artist: String, image: URL?, hits: [SaavnAPI.Hit], kind: String, note: String? = nil) -> CollectionDetail {
        let language = hits.first?.song.language.capitalized ?? ""
        let year = hits.first.map { $0.song.year > 0 ? String($0.song.year) : "" } ?? ""
        let meta = [kind, language, year].filter { !$0.isEmpty }.joined(separator: " · ")
        let minutes = max(1, Int((hits.reduce(0) { $0 + $1.song.duration } / 60).rounded()))
        let label = hits.first?.song.label ?? ""
        var footer = ["\(hits.count) \(hits.count == 1 ? "song" : "songs"), \(minutes) \(minutes == 1 ? "minute" : "minutes")"]
        if !label.isEmpty { footer.append("℗ \(label)") }
        return CollectionDetail(title: title, artist: artist, meta: meta, imageURL: image, songs: hits.map { .hit($0) },
                                note: note, footer: footer)
    }
}
