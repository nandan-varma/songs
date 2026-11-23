import ModesCore
import SwiftUI

struct SongPreviewCard: View {
    @Environment(AppModel.self) private var model
    let item: QueueItem

    var body: some View {
        let shown = model.display(item)
        HStack(spacing: 14) {
            Artwork(url: model.artURL(item), radius: 10).frame(width: 76, height: 76)
            VStack(alignment: .leading, spacing: 3) {
                Text(shown.title).font(.headline).lineLimit(2)
                Text(shown.compactArtist).font(.subheadline).foregroundStyle(.secondary).lineLimit(2)
                if let context = shown.context { Text(context).font(.caption).foregroundStyle(.secondary).lineLimit(1) }
            }
            Spacer(minLength: 0)
        }
        .padding(14)
        .frame(width: 330)
        .background(.regularMaterial)
    }
}
