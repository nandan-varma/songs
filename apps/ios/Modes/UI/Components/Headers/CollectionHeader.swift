import SwiftUI

struct CollectionHeader<ArtworkContent: View, Content: View>: View {
    @ViewBuilder var artwork: ArtworkContent
    @ViewBuilder var content: Content

    var body: some View {
        HStack(alignment: .center, spacing: 16) {
            artwork.frame(width: 84, height: 84).clipShape(.rect(cornerRadius: 12))
            VStack(alignment: .leading, spacing: 10) { content }
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, 8)
    }
}
