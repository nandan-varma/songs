import SwiftUI

struct SettingsButton: View {
    @State private var showSettings = false

    var body: some View {
        Button("Settings", systemImage: "gearshape") { showSettings = true }
            .labelStyle(.iconOnly)
            .sheet(isPresented: $showSettings) { SettingsView() }
    }
}
