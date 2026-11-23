import SwiftUI

/// Opens the Settings sheet from the toolbar, like the Music app's account row.
struct SettingsButton: View {
    @State private var showSettings = false

    var body: some View {
        Button("Settings", systemImage: "gearshape") { showSettings = true }
            .labelStyle(.iconOnly)
            .sheet(isPresented: $showSettings) { SettingsView() }
    }
}
