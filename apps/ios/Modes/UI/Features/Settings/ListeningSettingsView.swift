import SwiftUI

struct ListeningSettingsView: View {
    @Environment(AppModel.self) private var model
    @State private var confirmReset = false

    var body: some View {
        @Bindable var model = model
        Form {
            Section {
                LanguageChips(selected: languages).padding(.vertical, 4)
            } header: { Text("Languages") } footer: {
                Text("Recommendations only come from these languages. Changing them filters what you hear; it does not reset what the profile has learned.")
            }

            Section {
                Toggle("Pause personalization", isOn: $model.settings.personalizationPaused)
                Toggle("Show why a song was picked", isOn: $model.settings.showWhy)
            } footer: {
                Text("Pausing stops learning from playback and favorites. “Suggest less” still hides songs.")
            }

            Section {
                Button("Reset what it learned", role: .destructive) { confirmReset = true }
            } footer: {
                Text("Starts the profile over and uses your favorites as the first evidence.")
            }
        }
        .navigationTitle("Listening").navigationBarTitleDisplayMode(.inline)
        .confirmationDialog("Reset what it learned?", isPresented: $confirmReset, titleVisibility: .visible) {
            Button("Reset", role: .destructive) { model.resetProfile() }
        } message: {
            Text("The profile starts fresh and your favorites are used again as likes. Favorites and history stay.")
        }
    }

    private var languages: Binding<[String]> {
        Binding(get: { model.settings.languages },
                set: { if !$0.isEmpty { model.settings.languages = $0 } })
    }
}
