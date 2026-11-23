import ModesCore
import SwiftUI

/// The shared look of a song row: artwork, title, then artist with the film as quieter trailing text, and an optional
/// trailing accessory. Used for search, library, search and Up Next rows.
struct SongRowContent<Trailing: View>: View {
    let artworkURL: URL?
    let display: SongDisplay
    @ViewBuilder var trailing: Trailing
    @Environment(\.dynamicTypeSize) private var typeSize

    /// "A, B +1 · Film": the film is last, so it is the first thing to be cut when the row is narrow.
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
        .padding(.vertical, 2)                                  // a little air so tall Indic glyphs never touch the row edge
        .contentShape(.rect)
        .accessibilityElement(children: .combine)
    }
}
