import SwiftUI

struct InterfaceSettingsView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        @Bindable var model = model
        Form {
            Section {
                Picker("Appearance", selection: $model.settings.appearance) {
                    ForEach(Appearance.allCases, id: \.self) { Text($0.title).tag($0) }
                }
                Toggle("Artwork-tinted player", isOn: $model.settings.tintedPlayer)
            } footer: {
                Text("Off gives the player a neutral dark background.")
            }

            Section {
                Toggle("Haptics", isOn: $model.settings.haptics)
                NavigationLink("Swipe actions") { SwipeSettingsView() }
            }
        }
        .navigationTitle("Interface").navigationBarTitleDisplayMode(.inline)
    }
}
