import SwiftUI

/// The app's only account surface: a plain Settings sheet, like the Music app's account row.
struct SettingsButton: View {
    @State private var showSettings = false

    var body: some View {
        Button("Settings", systemImage: "gearshape") { showSettings = true }
            .labelStyle(.iconOnly)
            .sheet(isPresented: $showSettings) { SettingsView() }
    }
}
