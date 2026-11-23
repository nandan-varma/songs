import ModesCore
import SwiftUI

struct LocalPlaylistView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    let playlistID: UUID

    @State private var renaming = false
    @State private var draftName = ""
    @State private var confirmDelete = false

    private var playlist: LocalPlaylist? { model.playlists.first { $0.id == playlistID } }

    var body: some View {
        Group {
            if let playlist {
                let context = playlist.songs.map { SongReference.library($0) }
                List {
                    Section {
                        ForEach(playlist.songs) { item in
                            SongListRow(source: .library(item), context: context)
                                .swipeActions {
                                    Button("Remove", systemImage: "minus.circle", role: .destructive) {
                                        model.removeFromPlaylist(item.id, playlistID: playlistID)
                                    }
                                }
                        }
                    }
                }
                .musicListStyle()
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Menu("Playlist options", systemImage: "ellipsis") {
                            Button("Rename", systemImage: "pencil") {
                                draftName = playlist.name
                                renaming = true
                            }
                            Button("Delete playlist", systemImage: "trash", role: .destructive) {
                                confirmDelete = true
                            }
                        }
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Play", systemImage: "play.fill") {
                            guard let first = playlist.songs.first else { return }
                            model.playSong(.library(first), in: context)
                        }
                        .disabled(playlist.songs.isEmpty)
                    }
                }
                .alert("Rename playlist", isPresented: $renaming) {
                    TextField("Name", text: $draftName)
                    Button("Save") { model.renamePlaylist(playlistID, to: draftName) }
                    Button("Cancel", role: .cancel) {}
                }
                .confirmationDialog("Delete this playlist?", isPresented: $confirmDelete, titleVisibility: .visible) {
                    Button("Delete", role: .destructive) { model.deletePlaylist(playlistID); dismiss() }
                }
            } else {
                ContentUnavailableView("Playlist not found", systemImage: "music.note.list")
            }
        }
        .navigationTitle(playlist?.name ?? "Playlist")
        .navigationBarTitleDisplayMode(.inline)
    }
}
