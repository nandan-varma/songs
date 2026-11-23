import SwiftUI
extension Font {
    static let rowTitle = Font.body
    static let rowSubtitle = Font.subheadline
    static let playerMeta = Font.footnote
    static let toastMessage = Font.footnote.weight(.semibold)
}

extension ShapeStyle where Self == Color {
    static var playerSecondary: Color { .white.opacity(0.78) }
}

extension View {
    func captionBlock(lines: Int = 2) -> some View {
        lineLimit(lines).fixedSize(horizontal: false, vertical: true)
    }
}
