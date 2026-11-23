import SwiftUI

enum MusicRoute: Hashable {
    case album(String)
    case playlist(String)
    case artist(String)
    case chart(String)
}

extension View {
    func musicRoutes() -> some View {
        navigationDestination(for: MusicRoute.self) { CollectionView(route: $0) }
    }
}

struct CollectionRow: View {
    let imageURL: URL?
    let title: String
    let subtitle: String
    var round = false

    var body: some View {
        HStack(spacing: 12) {
            Artwork(url: imageURL)
                .frame(width: 52, height: 52)
                .clipShape(round ? AnyShape(.circle) : AnyShape(.rect(cornerRadius: 10)))
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.subheadline)
                if !subtitle.isEmpty {
                    Text(subtitle).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                }
            }
        }
        .padding(.vertical, 3)
    }
}

private struct CollectionDetail {
    let title: String
    let subtitle: String
    let imageURL: URL?
    let songs: [SaavnAPI.Song]
    let albums: [SaavnAPI.Album]
    var round = false
}

struct CollectionView: View {
    @Environment(AppModel.self) private var model
    let route: MusicRoute

    @State private var detail: CollectionDetail?
    @State private var loading = true
    @State private var failed = false

    var body: some View {
        Group {
            if let detail {
                List {
                    CollectionHeader {
                        Artwork(url: detail.imageURL)
                    } content: {
                        Text(detail.title).font(.title2.bold())
                        if !detail.subtitle.isEmpty {
                            Text(detail.subtitle).font(.subheadline).foregroundStyle(.secondary)
                        }
                    }
                    .listRowBackground(Color.clear)

                    if !detail.albums.isEmpty {
                        Section("Albums") {
                            ForEach(detail.albums) { album in
                                NavigationLink(value: MusicRoute.album(album.id)) {
                                    CollectionRow(imageURL: album.image, title: album.name,
                                                  subtitle: album.subtitle ?? "")
                                }
                            }
                        }
                    }

                    Section("Songs") {
                        let hits = detail.songs.compactMap(\.hit)
                        if hits.isEmpty {
                            Text("No playable songs here.").foregroundStyle(.secondary)
                        } else {
                            let context = hits.map { SongReference.hit($0) }
                            ForEach(hits, id: \.song.id) { hit in
                                SongListRow(source: .hit(hit), context: context)
                            }
                        }
                    }
                }
                .musicListStyle()
            } else if loading {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ContentUnavailableView("Couldn’t load this", systemImage: "wifi.exclamationmark",
                                       description: Text(failed ? "Check your connection and try again." : "Nothing here."))
            }
        }
        .navigationTitle(detail?.title ?? "")
        .navigationBarTitleDisplayMode(.inline)
        .task(id: route) { await load() }
    }

    private func load() async {
        loading = true
        failed = false
        defer { loading = false }
        do {
            switch route {
            case .album(let id):
                let album = try await SaavnAPI.album(id: id, baseURL: model.settings.baseURL,
                                                     highQuality: model.settings.highQuality)
                detail = CollectionDetail(title: album.name, subtitle: album.subtitle ?? "",
                                          imageURL: album.image, songs: album.songs, albums: [])
            case .playlist(let id):
                let playlist = try await SaavnAPI.playlist(id: id, baseURL: model.settings.baseURL,
                                                           highQuality: model.settings.highQuality)
                detail = CollectionDetail(title: playlist.name, subtitle: "\(playlist.songs.count) songs",
                                          imageURL: playlist.image, songs: playlist.songs, albums: [])
            case .artist(let id):
                let artist = try await SaavnAPI.artist(id: id, baseURL: model.settings.baseURL,
                                                       highQuality: model.settings.highQuality)
                detail = CollectionDetail(title: artist.name, subtitle: artist.roles.joined(separator: " · "),
                                          imageURL: artist.image, songs: artist.songs, albums: artist.albums,
                                          round: true)
            case .chart(let id):
                let chart = try await SaavnAPI.chart(id: id, baseURL: model.settings.baseURL,
                                                     highQuality: model.settings.highQuality)
                detail = CollectionDetail(title: chart.name, subtitle: "\(chart.songs.count) songs",
                                          imageURL: chart.image, songs: chart.songs, albums: [])
            }
            if let detail {
                ImagePipeline.shared.prefetch(detail.songs.compactMap(\.image)
                    + detail.albums.compactMap(\.image) + [detail.imageURL].compactMap { $0 })
            }
        } catch {
            detail = nil
            failed = true
        }
    }
}
