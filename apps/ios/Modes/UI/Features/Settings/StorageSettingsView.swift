import SwiftUI

struct StorageSettingsView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var cacheBytes = 0
    @State private var confirmErase = false

    var body: some View {
        Form {
            Section {
                LabeledContent("Cache size", value: Int64(cacheBytes).formatted(.byteCount(style: .file)))
                Button("Clear cache") {
                    model.clearCaches()
                    cacheBytes = model.cacheSize
                }
            } footer: {
                Text("Artwork and recent responses. They download again when needed.")
            }

            Section {
                if FileManager.default.fileExists(atPath: AppModel.eventsURL.path) {
                    ShareLink("Export listening log", item: AppModel.eventsURL)
                }
                Button("Erase favorites, history and log", role: .destructive) { confirmErase = true }
            } footer: {
                Text("Listening, favorites and the exported log stay on this iPhone.")
            }
        }
        .navigationTitle("Storage & Data").navigationBarTitleDisplayMode(.inline)
        .task { cacheBytes = model.cacheSize }
        .confirmationDialog("Erase favorites, history and log?", isPresented: $confirmErase, titleVisibility: .visible) {
            Button("Erase", role: .destructive) { model.resetEverything(); dismiss() }
        } message: {
            Text("Favorites, recently played, the listening log and everything the profile has learned are erased. Your settings stay. This can’t be undone.")
        }
    }
}
