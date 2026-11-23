import UIKit
import SwiftUI

struct Artwork: View {
    let url: URL?
    var radius: CGFloat = 8
    @State private var image: UIImage?

    init(url: URL?, radius: CGFloat = 8) {
        self.url = url
        self.radius = radius
        _image = State(initialValue: ImagePipeline.shared.cached(url))
    }

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
            .animation(.easeOut(duration: 0.16), value: image != nil)
            .task(id: url) {
                if let hit = ImagePipeline.shared.cached(url) { image = hit; return }
                guard let url else { image = nil; return }
                image = await ImagePipeline.shared.image(for: url)
            }
    }
}
