import ModesCore
import SwiftUI

struct SearchView: View {
    @Environment(AppModel.self) private var model
    @State private var query = ""
    @State private var scope = SearchScope.all
    @State private var settled: String?
    @State private var overview = OverviewSearch()
    @State private var attempt = 0

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Search")
                .navigationBarTitleDisplayMode(.inline)
                .searchable(text: $query, prompt: "Songs, albums, artists")
                .searchScopes($scope, activation: .onTextEntry) {
                    ForEach(SearchScope.allCases, id: \.self) { Text($0.title).tag($0) }
                }
                .searchSuggestions { recents }
                .onSubmit(of: .search) { model.rememberSearch(query) }
                .toolbar { ToolbarItem(placement: .topBarTrailing) { SettingsButton() } }
                .musicRoutes()
                .task(id: query) {
                    guard let text = SearchQuery.normalized(query) else { settled = nil; return }
                    guard text != settled else { return }
                    do { try await Task.sleep(for: .milliseconds(200)) } catch { return }
                    settled = text
                }
                .task(id: "\(settled ?? "")|\(scope)|\(model.delivery)|\(attempt)") {
                    guard scope == .all, let settled else { return }
                    await overview.reload(settled, delivery: model.delivery)
                }
        }
    }

    @ViewBuilder private var content: some View {
        if let settled {
            if scope == .all { overviewContent(settled) } else { SearchResultsList(scope: scope, query: settled) }
        } else {
            SearchBrowseView()
        }
    }

    @ViewBuilder private func overviewContent(_ text: String) -> some View {
        if let found = overview.overview {
            if found.results.isEmpty, overview.loadedQuery == text, !overview.loading {
                ContentUnavailableView.search(text: text)
            } else {
                OverviewList(overview: found, query: overview.loadedQuery)
            }
        } else if overview.failed {
            LoadFailedView { attempt += 1 }
        } else {
            List { SkeletonRows() }.musicListStyle()
        }
    }

    @ViewBuilder private var recents: some View {
        if SearchQuery.normalized(query) == nil, !model.recentSearches.terms.isEmpty {
            Section {
                ForEach(model.recentSearches.terms, id: \.self) { term in
                    Label(term, systemImage: "clock").searchCompletion(term)
                }
            } header: {
                HStack {
                    Text("Recent searches")
                    Spacer()
                    Button("Clear") { model.clearRecentSearches() }.font(.subheadline)
                }
            }
        }
    }
}

private struct OverviewList: View {
    let overview: SaavnAPI.SearchOverview
    let query: String

    var body: some View {
        let results = overview.results
        let context = results.songs.map { SongReference.hit($0) }
        List {
            if let top = overview.top {
                Section("Top result") { TopResultRow(top: top, songs: results.songs, context: context) }
            }
            if !results.songs.isEmpty {
                Section { ForEach(results.songs) { SongListRow(source: .hit($0), context: context) } }
                    header: { header("Songs", .songs, results.songs.count) }
            }
            if !results.albums.isEmpty {
                Section {
                    ForEach(results.albums) { album in
                        NavigationLink(value: MusicRoute.album(album.id)) {
                            CollectionRow(imageURL: album.image, title: album.name, subtitle: album.subtitle ?? "")
                        }
                    }
                } header: { header("Albums", .albums, results.albums.count) }
            }
            if !results.artists.isEmpty {
                Section {
                    ForEach(results.artists) { artist in
                        NavigationLink(value: MusicRoute.artist(artist.id)) {
                            CollectionRow(imageURL: artist.image, title: artist.name, subtitle: artist.roles.first ?? "", round: true)
                        }
                    }
                } header: { header("Artists", .artists, results.artists.count) }
            }
            if !results.playlists.isEmpty {
                Section {
                    ForEach(results.playlists) { playlist in
                        NavigationLink(value: MusicRoute.playlist(playlist.id)) {
                            CollectionRow(imageURL: playlist.image, title: playlist.name, subtitle: playlist.subtitle ?? "")
                        }
                    }
                } header: { header("Playlists", .playlists, results.playlists.count) }
            }
        }
        .musicListStyle()
    }

    @ViewBuilder private func header(_ title: String, _ scope: SearchScope, _ count: Int) -> some View {
        HStack {
            Text(title).font(.title3.bold()).foregroundStyle(.primary).textCase(nil)
                .accessibilityAddTraits(.isHeader)
            Spacer()
            if count >= SaavnAPI.overviewLimit {
                NavigationLink("See all", value: SearchRoute(scope: scope, query: query))
                    .font(.subheadline).textCase(nil)
            }
        }
    }
}

private struct TopResultRow: View {
    let top: SaavnAPI.TopResult
    let songs: [SaavnAPI.Hit]
    let context: [SongReference]

    var body: some View {
        if top.kind == .song, let hit = songs.first(where: { $0.song.id == top.id }) {
            SongListRow(source: .hit(hit), context: context)
        } else if let route {
            NavigationLink(value: route) {
                CollectionRow(imageURL: top.image, title: top.name,
                              subtitle: [top.kind.rawValue.capitalized, top.subtitle].compactMap { $0 }.joined(separator: " · "),
                              round: top.kind == .artist)
            }
        }
    }

    private var route: MusicRoute? {
        switch top.kind {
        case .album: .album(top.id)
        case .artist: .artist(top.id)
        case .playlist: .playlist(top.id)
        case .song: nil
        }
    }
}
