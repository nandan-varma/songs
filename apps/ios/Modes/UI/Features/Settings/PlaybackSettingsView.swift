import ModesCore
import SwiftUI

struct PlaybackSettingsView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        @Bindable var model = model
        Form {
            Section {
                qualityPicker("On Wi-Fi", $model.settings.wifiQuality)
                qualityPicker("On cellular", $model.settings.cellularQuality)
                Toggle("Data saver", isOn: $model.settings.dataSaver)
            } header: { Text("Streaming quality") } footer: {
                Text("Data saver plays Low and loads small artwork on cellular.")
            }

            Section {
                Toggle("Autoplay similar songs", isOn: $model.settings.autoplay)
                Toggle("Allow explicit songs", isOn: $model.settings.allowExplicit)
                Toggle("Resume last song on launch", isOn: $model.settings.resumeOnLaunch)
            } footer: {
                Text("With autoplay off, playback stops when your queue ends.")
            }
        }
        .navigationTitle("Playback & Quality").navigationBarTitleDisplayMode(.inline)
    }

    private func qualityPicker(_ title: String, _ selection: Binding<QualityPreference>) -> some View {
        Picker(title, selection: selection) {
            ForEach(QualityPreference.allCases, id: \.self) { Text($0.title).tag($0) }
        }
    }
}
