import ModesCore
import SwiftUI

struct LibraryView: View {
    @Environment(AppModel.self) private var model
    @State private var segment: Segment = .favorites
    @State private var confirmClear = false
    @State private var creatingPlaylist = false
    @State private var newPlaylistName = ""
    @State private var pendingPlaylistDelete: LocalPlaylist?
    @Environment(\.dynamicTypeSize) private var typeSize

    enum Segment: String, CaseIterable, Identifiable {
        case favorites = "Favorites", recents = "Recently played", playlists = "Playlists"
        var id: Self { self }
    }

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Library")
                .navigationBarTitleDisplayMode(.inline)
                .safeAreaInset(edge: .top, spacing: 0) { picker }
                .background(Color(.systemBackground))
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) { SettingsButton() }
                    if segment == .recents, !model.recentItems.isEmpty {
                        ToolbarItem(placement: .topBarTrailing) {
                            Menu("Library options", systemImage: "ellipsis") {
                                Button("Clear recently played", systemImage: "trash", role: .destructive) { confirmClear = true }
                            }
                        }
                    }
                    if segment == .playlists {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("New playlist", systemImage: "plus") { creatingPlaylist = true }
                        }
                    }
                }
                .confirmationDialog("Clear recently played?", isPresented: $confirmClear, titleVisibility: .visible) {
                    Button("Clear", role: .destructive) { model.clearRecents() }
                }
                .alert("New playlist", isPresented: $creatingPlaylist) {
                    TextField("Name", text: $newPlaylistName)
                    Button("Create") { model.createPlaylist(named: newPlaylistName); newPlaylistName = "" }
                    Button("Cancel", role: .cancel) { newPlaylistName = "" }
                }
                .confirmationDialog("Delete this playlist?", isPresented: Binding(
                    get: { pendingPlaylistDelete != nil },
                    set: { if !$0 { pendingPlaylistDelete = nil } }
                ), titleVisibility: .visible) {
                    Button("Delete", role: .destructive) {
                        if let playlist = pendingPlaylistDelete { model.deletePlaylist(playlist.id) }
                        pendingPlaylistDelete = nil
                    }
                } message: {
                    Text(pendingPlaylistDelete.map { "“\($0.name)” and its song list will be removed." } ?? "")
                }
        }
    }

    private var picker: some View {
        Group {
            if typeSize.isAccessibilitySize {
                segmentPicker.pickerStyle(.menu)
            } else {
                segmentPicker.pickerStyle(.segmented)
            }
        }
        .padding(.horizontal, MusicLayout.pageInset).padding(.bottom, 8)
        .background(Color(.systemBackground))
    }

    private var segmentPicker: some View {
        Picker("Library", selection: $segment) {
            ForEach(Segment.allCases) { Text(LocalizedStringKey($0.rawValue)).tag($0) }
        }
    }

    @ViewBuilder private var content: some View {
        switch segment {
        case .favorites:
            if model.favoriteItems.isEmpty {
                ContentUnavailableView("No favorites yet", systemImage: "heart",
                                       description: Text("Tap the heart in the player, or swipe the cover right."))
            } else {
                let items = model.favoriteItems
                let context = items.map { SongReference.library($0) }
                List(items) { item in
                    SongListRow(source: .library(item), context: context)
                }
                .musicListStyle()
            }
        case .recents:
            if model.recentItems.isEmpty {
                ContentUnavailableView("Nothing played yet", systemImage: "clock",
                                       description: Text("Songs you play show up here."))
            } else {
                let items = model.recentItems
                let context = items.map { SongReference.library($0) }
                List(items) { item in
                    SongListRow(source: .library(item), context: context, detail: item.addedAt.relativeLabel)
                }.musicListStyle()
            }
        case .playlists:
            if model.playlists.isEmpty {
                ContentUnavailableView("No playlists yet", systemImage: "music.note.list",
                                       description: Text("Create one and add songs from any list."))
            } else {
                List {
                    ForEach(model.playlists) { playlist in
                        NavigationLink {
                            LocalPlaylistView(playlistID: playlist.id)
                        } label: {
                            CollectionRow(imageURL: playlist.songs.first?.imageURL, title: playlist.name,
                                          subtitle: "\(playlist.songs.count) songs")
                        }
                        .swipeActions {
                            Button("Delete", systemImage: "trash", role: .destructive) {
                                pendingPlaylistDelete = playlist
                            }
                        }
                    }
                }
                .musicListStyle()
            }
        }
    }
}
