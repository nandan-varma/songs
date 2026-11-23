import ModesCore
import SwiftUI

enum LibraryRoute: Hashable {
    case playlists, artists, songs, recents
    case playlist(UUID)
    case artistName(String)
}

struct LibraryView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.metrics) private var metrics
    @Namespace private var zoom

    private var rows: [(String, String, LibraryRoute?, MusicRoute?)] {
        [("Playlists", "music.note.list", .playlists, nil),
         ("Artists", "music.mic", .artists, nil),
         ("Songs", "music.note", .songs, nil),
         ("Recently Played", "clock", .recents, nil),
         ("Made for You", "person.crop.square", nil, .forYou)]
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: metrics.shelfSpacing) {
                    VStack(spacing: 0) {
                        ForEach(rows, id: \.0) { row in
                            if let library = row.2 {
                                NavigationLink(value: library) { categoryRow(row.0, row.1) }.buttonStyle(.plain)
                            } else if let music = row.3 {
                                NavigationLink(value: music) { categoryRow(row.0, row.1) }.buttonStyle(.plain)
                            }
                        }
                    }
                    .padding(.horizontal, metrics.inset)
                    recentlyAdded
                }
                .padding(.top, 4)
                .padding(.bottom, 160)
            }
            .scrollIndicators(.hidden)
            .navigationTitle("Library")
            .toolbar { ToolbarItem(placement: .topBarTrailing) { ProfileButton() } }
            .navigationDestination(for: LibraryRoute.self) { route in
                switch route {
                case .playlists: PlaylistsList()
                case .artists: ArtistNamesList()
                case .songs: FavoriteSongsList()
                case .recents: RecentSongsList()
                case .playlist(let id): LocalPlaylistView(playlistID: id)
                case .artistName(let name): SearchResultsList(scope: .artists, query: name).navigationTitle(name)
                }
            }
            .environment(\.zoomNamespace, zoom)
            .musicRoutes()
        }
    }

    private func categoryRow(_ title: String, _ icon: String) -> some View {
        HStack(spacing: metrics.gap + 4) {
            Image(systemName: icon).font(.title3).foregroundStyle(Color.accentColor).frame(width: 30 * metrics.unit)
            Text(title).font(.amRowTitle)
            Spacer()
            Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
        }
        .padding(.vertical, 12)
        .contentShape(.rect)
        .rowSeparator(leading: 30 * metrics.unit + metrics.gap + 4)
        .foregroundStyle(.primary)
    }

    @ViewBuilder private var recentlyAdded: some View {
        let items = Array(model.favoriteItems.prefix(12))
        if !items.isEmpty {
            let context = model.favoriteItems.map { SongReference.library($0) }
            VStack(alignment: .leading, spacing: metrics.gap) {
                ShelfHeader(title: "Recently Added")
                LazyVGrid(columns: [GridItem(.flexible(), spacing: metrics.gap, alignment: .top), GridItem(.flexible(), alignment: .top)],
                          spacing: metrics.gap) {
                    ForEach(items) { item in
                        Button { model.playSong(.library(item), in: context) } label: {
                            VStack(alignment: .leading, spacing: 0) {
                                Artwork(url: item.imageURL, radius: metrics.cardRadius).aspectRatio(1, contentMode: .fit)
                                Text(item.title).font(.amCardTitle).lineLimit(1).padding(.top, 8)
                                Text(item.artist).font(.amCardTitle).foregroundStyle(.secondary).lineLimit(1)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .buttonStyle(CardPressStyle())
                    }
                }
                .padding(.horizontal, metrics.inset)
            }
        } else {
            ContentUnavailableView("Nothing in your Library yet", systemImage: "star",
                                   description: Text("Favorite songs from the player and they show up here."))
        }
    }
}

private struct FavoriteSongsList: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        let items = model.favoriteItems
        let context = items.map { SongReference.library($0) }
        Group {
            if items.isEmpty {
                ContentUnavailableView("No songs yet", systemImage: "star", description: Text("Tap the star in the player to add songs."))
            } else {
                List(items) { SongListRow(source: .library($0), context: context) }.musicListStyle()
            }
        }
        .navigationTitle("Songs").navigationBarTitleDisplayMode(.large)
    }
}

private struct RecentSongsList: View {
    @Environment(AppModel.self) private var model
    @State private var confirmClear = false

    var body: some View {
        let items = model.recentItems
        let context = items.map { SongReference.library($0) }
        Group {
            if items.isEmpty {
                ContentUnavailableView("Nothing played yet", systemImage: "clock", description: Text("Songs you play show up here."))
            } else {
                List(items) { SongListRow(source: .library($0), context: context, detail: $0.addedAt.relativeLabel) }.musicListStyle()
            }
        }
        .navigationTitle("Recently Played").navigationBarTitleDisplayMode(.large)
        .toolbar {
            if !items.isEmpty {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu("Options", systemImage: "ellipsis") { Button("Clear recently played", systemImage: "trash", role: .destructive) { confirmClear = true } }
                }
            }
        }
        .confirmationDialog("Clear recently played?", isPresented: $confirmClear, titleVisibility: .visible) {
            Button("Clear", role: .destructive) { model.clearRecents() }
        }
    }
}

private struct ArtistNamesList: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        let names = Dictionary(grouping: model.favoriteItems + model.recentItems) {
            $0.artist.split(separator: ",").first.map { $0.trimmingCharacters(in: .whitespaces) } ?? $0.artist
        }
        .filter { !$0.key.isEmpty }
        .sorted { $0.value.count > $1.value.count || ($0.value.count == $1.value.count && $0.key < $1.key) }
        Group {
            if names.isEmpty {
                ContentUnavailableView("No artists yet", systemImage: "music.mic", description: Text("Artists you play and favorite show up here."))
            } else {
                List(names, id: \.key) { entry in
                    LinkRow(route: LibraryRoute.artistName(entry.key), imageURL: entry.value.first?.imageURL, title: entry.key, subtitle: "Artist", round: true)
                }.musicListStyle()
            }
        }
        .navigationTitle("Artists").navigationBarTitleDisplayMode(.large)
    }
}

private struct PlaylistsList: View {
    @Environment(AppModel.self) private var model
    @State private var creating = false
    @State private var pendingDelete: LocalPlaylist?

    var body: some View {
        Group {
            if model.playlists.isEmpty {
                ContentUnavailableView("No playlists yet", systemImage: "music.note.list", description: Text("Create one and add songs from any list."))
            } else {
                List {
                    ForEach(model.playlists) { playlist in
                        PlaylistRow(playlist: playlist)
                            .swipeActions { Button("Delete", systemImage: "trash", role: .destructive) { pendingDelete = playlist } }
                    }
                }
                .musicListStyle()
            }
        }
        .navigationTitle("Playlists").navigationBarTitleDisplayMode(.large)
        .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("New playlist", systemImage: "plus") { creating = true } } }
        .sheet(isPresented: $creating) { NewPlaylistSheet() }
        .confirmationDialog("Delete this playlist?", isPresented: Binding(get: { pendingDelete != nil }, set: { if !$0 { pendingDelete = nil } }),
                            titleVisibility: .visible) {
            Button("Delete", role: .destructive) { if let p = pendingDelete { model.deletePlaylist(p.id) }; pendingDelete = nil }
        }
    }
}
