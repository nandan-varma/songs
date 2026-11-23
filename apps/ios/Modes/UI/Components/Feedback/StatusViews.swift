import SwiftUI

struct LoadFailedView: View {
    let retry: () -> Void

    var body: some View {
        ContentUnavailableView {
            Label("Can’t reach the music server", systemImage: "wifi.exclamationmark")
        } description: {
            Text("Check your connection and try again.")
        } actions: {
            Button("Try again", action: retry).buttonStyle(.bordered)
        }
    }
}

struct SkeletonRows: View {
    var count = 8

    var body: some View {
        ForEach(0..<count, id: \.self) { _ in
            HStack(spacing: MusicLayout.rowSpacing) {
                RoundedRectangle(cornerRadius: MusicLayout.artworkRadius, style: .continuous)
                    .frame(width: MusicLayout.rowArtwork, height: MusicLayout.rowArtwork)
                VStack(alignment: .leading, spacing: 8) {
                    Capsule().frame(width: 160, height: 12)
                    Capsule().frame(width: 100, height: 10)
                }
                Spacer(minLength: 0)
            }
            .foregroundStyle(Color(.secondarySystemFill))
            .padding(.vertical, 2)
            .listRowBackground(Color.clear)
            .listRowSeparator(.hidden)
            .accessibilityHidden(true)
        }
    }
}
