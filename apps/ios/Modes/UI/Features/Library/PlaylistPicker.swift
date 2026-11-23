import ModesCore
import SwiftUI

struct PlaylistPicker: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    let source: SongReference

    @State private var creating = false
    @State private var name = ""

    var body: some View {
        NavigationStack {
            List {
                Button("New playlist", systemImage: "plus") { creating = true }
                if !model.playlists.isEmpty {
                    Section("Playlists") {
                        ForEach(model.playlists) { playlist in
                            Button {
                                model.addToPlaylist(source, playlistID: playlist.id)
                                dismiss()
                            } label: {
                                row(playlist)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Add to playlist")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
            .alert("New playlist", isPresented: $creating) {
                TextField("Name", text: $name)
                Button("Create") {
                    let id = model.createPlaylist(named: name)
                    model.addToPlaylist(source, playlistID: id)
                    dismiss()
                }
                Button("Cancel", role: .cancel) {}
            }
        }
        .presentationDetents([.medium, .large])
    }

    private func row(_ playlist: LocalPlaylist) -> some View {
        HStack {
            Text(playlist.name)
            Spacer()
            Text("\(playlist.songs.count)").foregroundStyle(.secondary)
        }
    }
}
