import ModesCore
import SwiftUI

struct SongRowContent<Trailing: View>: View {
    let artworkURL: URL?
    let display: SongDisplay
    @ViewBuilder var trailing: Trailing
    @Environment(\.dynamicTypeSize) private var typeSize

    private var subtitle: String {
        guard let context = display.context else { return display.compactArtist }
        return display.compactArtist.isEmpty ? context : display.compactArtist + " · " + context
    }

    var body: some View {
        HStack(spacing: MusicLayout.rowSpacing) {
            Artwork(url: artworkURL, radius: MusicLayout.artworkRadius)
                .frame(width: MusicLayout.rowArtwork, height: MusicLayout.rowArtwork)
            VStack(alignment: .leading, spacing: 4) {
                Text(display.title).font(.rowTitle).lineLimit(typeSize.isAccessibilitySize ? 3 : 1)
                Text(subtitle).font(.rowSubtitle).foregroundStyle(.secondary).lineLimit(typeSize.isAccessibilitySize ? 2 : 1)
            }
            Spacer(minLength: 0)
            trailing
        }
        .padding(.vertical, 2)
        .contentShape(.rect)
        .accessibilityElement(children: .combine)
    }
}
