import SwiftUI

/// The app's text styles. Every one is built on a Dynamic Type text style, so nothing here uses a fixed point size.
///
/// Rules used across the UI:
/// * Sentence case everywhere ("Hot right now", "Up next", "Playing from"); proper nouns keep their capitals.
/// * One title line per row, one quiet secondary line; long text truncates at the tail, never in the middle.
/// * Numbers and times use `monospacedDigit()`; captions that may wrap use `captionBlock()`.
/// * Secondary text on the player backdrop is `.playerSecondary` (see its contrast note).
extension Font {
    /// Section headers: "For You", "Recently played".
    static let sectionHeader = Font.title2.bold()
    /// A song's title in a row.
    static let rowTitle = Font.body
    /// Artist (and film) under a row title.
    static let rowSubtitle = Font.subheadline
    /// Trailing detail in a row: a date, a reason chip.
    static let rowDetail = Font.caption
    /// A card name under its tile.
    static let tileTitle = Font.subheadline.weight(.semibold)
    /// The line under a tile name.
    static let tileCaption = Font.caption
    /// Language pills and other chips.
    static let chip = Font.subheadline.weight(.medium)
    /// The expanded player's title and artist lines.
    static let playerTitle = Font.title3.weight(.semibold)
    static let playerArtist = Font.title3
    /// Times, "Playing from", the "why" label.
    static let playerMeta = Font.footnote
    static let playerMetaStrong = Font.footnote.weight(.semibold)
    /// The transient message capsule.
    static let toastMessage = Font.footnote.weight(.semibold)
}

extension ShapeStyle where Self == Color {
    /// Secondary text on the player backdrop.
    ///
    /// Contrast, computed for the worst case (a pure white cover). The backdrop is the blurred cover under a black overlay
    /// of `PlayerBackground.dimming` (0.42 + 0.23 x the cover's average luminance, so 0.65 for white). A white cover then
    /// renders as sRGB 0.35 (relative luminance 0.10). White text at 0.78 opacity blends to sRGB 0.86 (luminance 0.71):
    /// (0.71 + 0.05) / (0.10 + 0.05) = 5.0 : 1, above the 4.5 : 1 minimum. Primary white text is 7.0 : 1. Darker covers only
    /// increase these ratios, so no text shadow is needed.
    static var playerSecondary: Color { .white.opacity(0.78) }
}

extension View {
    /// A caption that may wrap to two lines and always gets the height it needs (Indic scripts have tall ascenders).
    func captionBlock(lines: Int = 2) -> some View {
        lineLimit(lines).fixedSize(horizontal: false, vertical: true)
    }
}
