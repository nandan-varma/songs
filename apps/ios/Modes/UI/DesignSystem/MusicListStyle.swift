import SwiftUI

enum MusicLayout {
    static let rowArtwork: CGFloat = 56
    static let rowSpacing: CGFloat = 12
    static let pageInset: CGFloat = 20
    static let artworkRadius: CGFloat = 8
}

extension View {
    func musicListStyle() -> some View {
        listStyle(.plain)
            .scrollContentBackground(.hidden)
            .background(Color(.systemBackground))
    }
}
