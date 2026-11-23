import Foundation

extension Date {
    private static let relativeStyle = Date.RelativeFormatStyle(presentation: .named, unitsStyle: .abbreviated)
    /// "2 hr. ago", "yesterday": a static, cached style, cheap enough to call per row.
    var relativeLabel: String { formatted(Self.relativeStyle) }
}
