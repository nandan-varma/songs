import Foundation

extension Date {
    private static let relativeStyle = Date.RelativeFormatStyle(presentation: .named, unitsStyle: .abbreviated)

    var relativeLabel: String { formatted(Self.relativeStyle) }
}
