import ModesCore
import SwiftUI

struct SettingsView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var confirmReset = false
    @State private var confirmErase = false
    private let languages = ["hindi", "english", "punjabi", "tamil", "telugu", "bengali", "marathi", "kannada", "malayalam", "gujarati", "bhojpuri", "haryanvi"]

    private var version: String {
        let v = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
        let b = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1"
        return "\(v) (\(b))"
    }

    var body: some View {
        @Bindable var model = model
        NavigationStack {
            Form {
                Section {
                    FlowLayout(spacing: 8) {
                        ForEach(languages, id: \.self) { language in
                            let on = model.settings.languages.contains(language)
                            Button {
                                if on {
                                    if model.settings.languages.count > 1 { model.settings.languages.removeAll { $0 == language } }
                                } else { model.settings.languages.append(language) }
                            } label: {
                                HStack(spacing: 6) {
                                    Text(language.capitalized)
                                    if on { Image(systemName: "checkmark").font(.caption.weight(.bold)) }
                                }
                                .font(.chip).padding(.horizontal, 12).frame(minHeight: 44)
                                .foregroundStyle(on ? Color(.systemBackground) : Color.primary)
                                .background(on ? Color.primary : Color(.tertiarySystemFill), in: .capsule)
                            }
                            .buttonStyle(.plain).accessibilityAddTraits(on ? .isSelected : [])
                        }
                    }.padding(.vertical, 4)
                } header: { Text("Languages") } footer: {
                    Text("Recommendations only come from these languages. Changing them filters what you hear; it does not reset what the profile has learned.")
                }

                Section {
                    Toggle("High quality (320 kbps)", isOn: $model.settings.highQuality)
                } header: { Text("Sound") }

                Section {
                    Toggle("Pause personalization", isOn: $model.settings.personalizationPaused)
                } header: { Text("Personalization") } footer: {
                    Text("Stops learning from playback and favorites. “Suggest less” still hides songs, and playback, favorites and history keep working.")
                }

                Section("Interaction") {
                    NavigationLink { SwipeSettingsView() } label: { Label("Swipe actions", systemImage: "hand.draw") }
                }

                Section {
                    NavigationLink { ModelStatsView() } label: { Label("Model statistics", systemImage: "chart.bar.xaxis") }
                } header: { Text("Debug") } footer: {
                    Text("Every number the on-device model has learned, including weights, hidden songs and the current For You ranking.")
                }

                Section {
                    Button("Reset what it learned") { confirmReset = true }
                } footer: {
                    Text("Starts the profile over and uses your library favorites as the first evidence. Favorites and history stay.")
                }

                Section {
                    if FileManager.default.fileExists(atPath: AppModel.eventsURL.path) { ShareLink("Export listening log", item: AppModel.eventsURL) }
                    Button("Erase favorites, history and log", role: .destructive) { confirmErase = true }
                } header: { Text("Your data") } footer: { Text("Listening, favorites and the exported log stay on this iPhone.") }

                Section("About Modes") {
                    LabeledContent("Version") { Text(version).monospacedDigit() }
                    Link("Source code", destination: URL(string: "https://github.com/nandan-varma/songs")!)
                    NavigationLink("Acknowledgements") { AcknowledgementsView() }
                }
            }
            .navigationTitle("Settings").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() }.fontWeight(.semibold) } }
            .confirmationDialog("Reset what it learned?", isPresented: $confirmReset, titleVisibility: .visible) {
                Button("Reset", role: .destructive) { model.resetProfile() }
            } message: {
                Text("The profile starts fresh and your favorites are used again as likes. Favorites and history stay.")
            }
            .confirmationDialog("Erase favorites, history and log?", isPresented: $confirmErase, titleVisibility: .visible) {
                Button("Erase", role: .destructive) { model.resetEverything(); dismiss() }
            } message: {
                Text("Favorites, recently played, the listening log and everything the profile has learned are erased. Your languages and other settings stay. This can’t be undone.")
            }
        }
    }
}
