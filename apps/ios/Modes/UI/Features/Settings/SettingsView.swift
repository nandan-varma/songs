import ModesCore
import SwiftUI

struct SettingsView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var confirmReset = false

    var body: some View {
        @Bindable var model = model
        NavigationStack {
            Form {
                Section {
                    NavigationLink { ListeningStatsView() } label: { header }
                }

                Section("Listening") {
                    NavigationLink { LanguagesSettingsView() } label: {
                        row("Languages", "globe", .blue, value: model.settings.languages.map(\.capitalized).joined(separator: ", "))
                    }
                    NavigationLink { QualitySettingsView() } label: {
                        row("Audio Quality", "waveform", .pink, value: model.settings.dataSaver ? "Data Saver" : model.settings.wifiQuality.title)
                    }
                    Toggle(isOn: $model.settings.autoplay) { row("Autoplay", "infinity", .orange) }
                    Toggle(isOn: $model.settings.allowExplicit) { row("Explicit Content", "e.square.fill", .gray) }
                    Toggle(isOn: $model.settings.resumeOnLaunch) { row("Resume on Launch", "play.circle.fill", .green) }
                }

                Section {
                    Toggle(isOn: Binding(get: { !model.settings.personalizationPaused }, set: { model.settings.personalizationPaused = !$0 })) {
                        row("Personalized Picks", "sparkles", .purple)
                    }
                    Toggle(isOn: $model.settings.showWhy) { row("Show Why", "questionmark.bubble.fill", .teal) }
                    NavigationLink { ListeningStatsView() } label: { row("Your Listening", "chart.bar.fill", .red) }
                    NavigationLink { ModelStatsView() } label: { row("Taste Model", "brain", .indigo) }
                    Button { confirmReset = true } label: { row("Reset What It Learned", "arrow.counterclockwise", .red) }
                        .foregroundStyle(.red)
                } header: { Text("For You") } footer: {
                    Text("Everything it learns, including how long you listen to each song, stays on this iPhone. Pausing stops learning; “Suggest less” still hides songs.")
                }

                Section("Appearance") {
                    Picker(selection: $model.settings.appearance) {
                        ForEach(Appearance.allCases, id: \.self) { Text($0.title).tag($0) }
                    } label: { row("Theme", "circle.lefthalf.filled", .gray) }
                    Toggle(isOn: $model.settings.tintedPlayer) { row("Artwork-Tinted Player", "paintpalette.fill", .pink) }
                    Toggle(isOn: $model.settings.haptics) { row("Haptics", "hand.tap.fill", .orange) }
                    NavigationLink { SwipeSettingsView() } label: { row("Swipe Actions", "arrow.left.arrow.right", .blue) }
                }

                Section {
                    NavigationLink { LabsView() } label: {
                        row("Labs", "flask.fill", .mint, value: "\(enabledLabs) on")
                    }
                } footer: { Text("Experimental features that rely on best-effort heuristics.") }

                Section {
                    NavigationLink { StorageSettingsView() } label: { row("Storage & Data", "internaldrive.fill", .gray) }
                    NavigationLink { AboutView() } label: { row("About", "info.circle.fill", .blue) }
                }
            }
            .navigationTitle("Settings").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() }.fontWeight(.semibold) } }
            .confirmationDialog("Reset what it learned?", isPresented: $confirmReset, titleVisibility: .visible) {
                Button("Reset", role: .destructive) { model.resetProfile() }
            } message: { Text("The profile starts fresh and your favorites are used again as likes. Favorites and history stay.") }
        }
    }

    private var header: some View {
        let stats = model.listening
        let week = stats.seconds(inLast: 7)
        return HStack(spacing: 14) {
            LogoMark().frame(width: 56, height: 56)
            VStack(alignment: .leading, spacing: 2) {
                Text("Modes").font(.title3.weight(.semibold))
                Text(week > 0 ? "\(Self.duration(week)) this week" + (stats.streak() > 1 ? " · \(stats.streak())-day streak" : "")
                              : "Play something to start your stats")
                    .font(.subheadline).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 6)
    }

    private var enabledLabs: Int {
        let labs = model.settings.labs
        return [labs.radioStations, labs.syncedLyrics, labs.genrePages, labs.moreLike, labs.launchShelves].filter { $0 }.count
    }

    static func duration(_ seconds: Double) -> String {
        let total = Int(seconds / 60)
        if total < 60 { return "\(max(total, 0)) min" }
        return total % 60 == 0 ? "\(total / 60) h" : "\(total / 60) h \(total % 60) min"
    }

    private func row(_ title: String, _ icon: String, _ tint: Color, value: String? = nil) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.footnote.weight(.semibold)).foregroundStyle(.white)
                .frame(width: 30, height: 30).background(tint.gradient, in: .rect(cornerRadius: 7, style: .continuous))
            Text(title)
            if let value, !value.isEmpty {
                Spacer(minLength: 8)
                Text(value).foregroundStyle(.secondary).lineLimit(1)
            }
        }
    }
}

struct LanguagesSettingsView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        Form {
            Section {
                LanguageChips(selected: Binding(get: { model.settings.languages },
                                                set: { if !$0.isEmpty { model.settings.languages = $0 } })).padding(.vertical, 4)
            } footer: {
                Text("Home, New, Radio and recommendations only come from these languages. Changing them filters what you hear; it does not reset what the profile has learned.")
            }
        }
        .navigationTitle("Languages").navigationBarTitleDisplayMode(.inline)
    }
}

struct QualitySettingsView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        @Bindable var model = model
        Form {
            Section {
                picker("On Wi-Fi", $model.settings.wifiQuality)
                picker("On Cellular", $model.settings.cellularQuality)
                Toggle("Data Saver", isOn: $model.settings.dataSaver)
            } footer: { Text("Data Saver plays Low and loads small artwork on cellular.") }
        }
        .navigationTitle("Audio Quality").navigationBarTitleDisplayMode(.inline)
    }

    private func picker(_ title: String, _ selection: Binding<QualityPreference>) -> some View {
        Picker(title, selection: selection) { ForEach(QualityPreference.allCases, id: \.self) { Text($0.title).tag($0) } }
    }
}

struct LabsView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        @Bindable var model = model
        Form {
            Section {
                Toggle("Home & New Shelves", isOn: $model.settings.labs.launchShelves)
                Toggle("Radio Stations", isOn: $model.settings.labs.radioStations)
                Toggle("Genre & Mood Pages", isOn: $model.settings.labs.genrePages)
                Toggle("Synced Lyrics", isOn: $model.settings.labs.syncedLyrics)
                Toggle("More Like…", isOn: $model.settings.labs.moreLike)
            } footer: {
                Text("JioSaavn has no official radio or genre feeds and no synced lyrics. Stations are built from playlists and artist songs, genre pages from search, and synced lyrics come from LRCLIB when it has the song.")
            }
        }
        .navigationTitle("Labs").navigationBarTitleDisplayMode(.inline)
    }
}
