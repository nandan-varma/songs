import ModesCore
import SwiftUI

struct SearchView: View {
    @Environment(AppModel.self) private var model
    @State private var query = ""
    @State private var results: SaavnAPI.SearchResults?
    @State private var searching = false
    @State private var failed = false

    var body: some View {
        NavigationStack {
            Group {
                if query.isEmpty {
                    SearchBrowseView()
                } else if let results, !isEmpty(results) {
                    list(results)
                } else if searching {
                    ProgressView()
                } else if failed {
                    ContentUnavailableView("Couldn’t search", systemImage: "wifi.exclamationmark",
                                           description: Text("Check your connection and try again."))
                } else {
                    ContentUnavailableView.search(text: query)
                }
            }
            .navigationTitle("Search")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $query, prompt: "Songs, albums, artists")
            .toolbar { ToolbarItem(placement: .topBarTrailing) { SettingsButton() } }
            .musicRoutes()
            .task(id: query) {
                let text = query.trimmingCharacters(in: .whitespaces)
                guard text.count >= 2 else { results = nil; failed = false; return }
                do { try await Task.sleep(for: .milliseconds(300)) } catch { return }
                guard !Task.isCancelled else { return }
                searching = true
                failed = false
                results = nil
                defer { searching = false }
                do {
                    let found = try await SaavnAPI.searchAll(query: text, baseURL: model.settings.baseURL,
                                                              highQuality: model.settings.highQuality)
                    guard !Task.isCancelled else { return }
                    results = found
                    ImagePipeline.shared.prefetch(found.songs.compactMap(\.image) + found.albums.compactMap(\.image)
                        + found.artists.compactMap(\.image) + found.playlists.compactMap(\.image))
                } catch {
                    guard !Task.isCancelled else { return }
                    results = nil
                    failed = true
                }
            }
        }
    }

    private func isEmpty(_ results: SaavnAPI.SearchResults) -> Bool {
        results.songs.isEmpty && results.albums.isEmpty && results.artists.isEmpty && results.playlists.isEmpty
    }

    private func list(_ results: SaavnAPI.SearchResults) -> some View {
        let hits = results.songs.compactMap(\.hit)
        let context = hits.map { SongReference.hit($0) }
        return List {
            if !hits.isEmpty {
                Section("Songs") {
                    ForEach(hits, id: \.song.id) { hit in
                        SongListRow(source: .hit(hit), context: context)
                    }
                }
            }
            if !results.albums.isEmpty {
                Section("Albums") {
                    ForEach(results.albums) { album in
                        NavigationLink(value: MusicRoute.album(album.id)) {
                            CollectionRow(imageURL: album.image, title: album.name, subtitle: album.subtitle ?? "")
                        }
                    }
                }
            }
            if !results.artists.isEmpty {
                Section("Artists") {
                    ForEach(results.artists) { artist in
                        NavigationLink(value: MusicRoute.artist(artist.id)) {
                            CollectionRow(imageURL: artist.image, title: artist.name,
                                          subtitle: artist.roles.first ?? "", round: true)
                        }
                    }
                }
            }
            if !results.playlists.isEmpty {
                Section("Playlists") {
                    ForEach(results.playlists) { playlist in
                        NavigationLink(value: MusicRoute.playlist(playlist.id)) {
                            CollectionRow(imageURL: playlist.image, title: playlist.name,
                                          subtitle: playlist.subtitle ?? "")
                        }
                    }
                }
            }
        }
        .musicListStyle()
    }
}
