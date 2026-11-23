import SwiftUI

struct SwipeSettingsView: View {
    @AppStorage(SongSwipePreference.enabled) private var enabled = true
    @AppStorage(SongSwipePreference.leading) private var leading = SongSwipeAction.favorite
    @AppStorage(SongSwipePreference.trailing) private var trailing = SongSwipeAction.playNext
    @AppStorage(SongSwipePreference.fullSwipe) private var fullSwipe = true

    var body: some View {
        Form {
            Section {
                Toggle("Song-list swipes", isOn: $enabled)
            }
            Section {
                actionPicker("Swipe right", selection: $leading)
                actionPicker("Swipe left", selection: $trailing)
                Toggle("Full swipe performs action", isOn: $fullSwipe)
            } footer: {
                Text("The same actions are available in each song’s menu. Player-cover gestures stay separate.")
            }
            .disabled(!enabled)
        }
        .navigationTitle("Swipe actions")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func actionPicker(_ title: String, selection: Binding<SongSwipeAction>) -> some View {
        Picker(title, selection: selection) {
            ForEach(SongSwipeAction.allCases) { action in Label(action.title, systemImage: action.icon).tag(action) }
        }
    }
}
