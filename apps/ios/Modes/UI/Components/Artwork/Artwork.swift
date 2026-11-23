import UIKit
import SwiftUI

/// Cover art with a quiet placeholder, served from the shared memory + disk image pipeline.
struct Artwork: View {
    let url: URL?
    var radius: CGFloat = 8
    @State private var image: UIImage?

    var body: some View {
        Color(.secondarySystemFill)
            .overlay { Image(systemName: "music.note").font(.title3).foregroundStyle(.tertiary) }
            .overlay {
                if let image {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .transition(.opacity)
                }
            }
            .clipShape(.rect(cornerRadius: radius, style: .continuous))
            .aspectRatio(1, contentMode: .fit)
            .animation(.easeInOut(duration: 0.18), value: image != nil)
            .task(id: url) {
                image = ImagePipeline.shared.cached(url)
                guard image == nil, let url else { return }
                image = await ImagePipeline.shared.image(for: url)
            }
    }
}
