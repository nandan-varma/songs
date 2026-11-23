import Foundation
import ModesCore
import UIKit

extension AppModel {
    func artURL(_ item: QueueItem) -> URL? { item.song.image ?? resolved[item.id]?.image }

    func cachedArt(for item: QueueItem?) -> UIImage? {
        ImagePipeline.shared.cached(item.flatMap { artURL($0) })
    }

    func warmArt(for item: QueueItem?) {
        guard let url = item.flatMap({ artURL($0) }) else { return }
        ImagePipeline.shared.prefetch([url])
    }

    func loadArt(for item: QueueItem) {
        artTask?.cancel()
        let g = playback.generation
        artTask = Task {
            guard let url = artURL(item) else { return }
            if let hit = ImagePipeline.shared.cached(url) {
                if playback.isCurrent(g) { currentArt = hit }
                return
            }
            if let image = await ImagePipeline.shared.image(for: url), !Task.isCancelled, playback.isCurrent(g) {
                currentArt = image
            }
        }
    }
}
