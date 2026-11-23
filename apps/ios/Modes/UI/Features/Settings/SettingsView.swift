import SwiftUI

struct SettingsView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        let settings = model.settings
        NavigationStack {
            List {
                Section {
                    row("Playback & Quality", "speaker.wave.2", value: settings.wifiQuality.title) { PlaybackSettingsView() }
                    row("Listening", "ear", value: settings.languages.map(\.capitalized).joined(separator: ", ")) { ListeningSettingsView() }
                    row("Interface", "paintbrush", value: settings.appearance.title) { InterfaceSettingsView() }
                    row("Storage & Data", "internaldrive", value: nil) { StorageSettingsView() }
                    row("About", "info.circle", value: nil) { AboutView() }
                }
            }
            .navigationTitle("Settings").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() }.fontWeight(.semibold) } }
        }
    }

    private func row<Destination: View>(_ title: String, _ icon: String, value: String?,
                                        @ViewBuilder destination: () -> Destination) -> some View {
        NavigationLink {
            destination()
        } label: {
            LabeledContent {
                if let value { Text(value).lineLimit(1) }
            } label: {
                Label(title, systemImage: icon)
            }
        }
    }
}
