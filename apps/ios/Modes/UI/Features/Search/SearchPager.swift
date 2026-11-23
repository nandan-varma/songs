import ModesCore
import SwiftUI

struct SearchPager<Item: Identifiable & Sendable, Row: View>: View {
    @Environment(AppModel.self) private var model
    @State private var pager = PagedSearch<Item>()
    @State private var attempt = 0

    let query: String
    let load: @Sendable (String, Int, Delivery) async throws -> SaavnAPI.SearchPage<Item>
    @ViewBuilder let row: (Item, [Item]) -> Row

    private var fetch: PagedSearch<Item>.Load {
        let delivery = model.delivery
        let load = load
        return { try await load($0, $1, delivery) }
    }

    var body: some View {
        let items = pager.results.items
        Group {
            if items.isEmpty, pager.failed {
                LoadFailedView { attempt += 1 }
            } else if items.isEmpty, !pager.loading {
                ContentUnavailableView.search(text: query)
            } else {
                List {
                    if items.isEmpty {
                        SkeletonRows()
                    } else {
                        ForEach(items) { item in
                            row(item, items).onAppear {
                                if item.id == items.last?.id { Task { await pager.more(load: fetch) } }
                            }
                        }
                        if pager.results.hasMore {
                            ProgressView().frame(maxWidth: .infinity).listRowBackground(Color.clear)
                        }
                    }
                }
                .musicListStyle()
            }
        }
        .task(id: "\(query)|\(model.delivery)|\(attempt)") { await pager.reload(query, load: fetch) }
    }
}

struct SearchResultsList: View {
    let scope: SearchScope
    let query: String

    var body: some View {
        switch scope {
        case .songs:
            SearchPager(query: query, load: { try await SaavnAPI.searchSongs($0, page: $1, delivery: $2) }) { hit, all in
                SongListRow(source: .hit(hit), context: all.map { .hit($0) })
            }
        case .albums:
            SearchPager(query: query, load: { try await SaavnAPI.searchAlbums($0, page: $1, delivery: $2) }) { album, _ in
                NavigationLink(value: MusicRoute.album(album.id)) {
                    CollectionRow(imageURL: album.image, title: album.name, subtitle: album.subtitle ?? "")
                }
            }
        case .artists:
            SearchPager(query: query, load: { try await SaavnAPI.searchArtists($0, page: $1, delivery: $2) }) { artist, _ in
                NavigationLink(value: MusicRoute.artist(artist.id)) {
                    CollectionRow(imageURL: artist.image, title: artist.name, subtitle: artist.roles.first ?? "", round: true)
                }
            }
        case .playlists:
            SearchPager(query: query, load: { try await SaavnAPI.searchPlaylists($0, page: $1, delivery: $2) }) { playlist, _ in
                NavigationLink(value: MusicRoute.playlist(playlist.id)) {
                    CollectionRow(imageURL: playlist.image, title: playlist.name, subtitle: playlist.subtitle ?? "")
                }
            }
        case .all:
            EmptyView()
        }
    }
}
