import SwiftUI

extension Font {
    static let sectionHeader = Font.title2.bold()

    static let rowTitle = Font.body

    static let rowSubtitle = Font.subheadline

    static let rowDetail = Font.caption

    static let tileTitle = Font.subheadline.weight(.semibold)

    static let tileCaption = Font.caption

    static let chip = Font.subheadline.weight(.medium)

    static let playerTitle = Font.title3.weight(.semibold)
    static let playerArtist = Font.title3

    static let playerMeta = Font.footnote
    static let playerMetaStrong = Font.footnote.weight(.semibold)

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
