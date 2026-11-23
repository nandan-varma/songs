import Foundation

extension AppModel {
    var cacheSize: Int { ImagePipeline.shared.diskUsage }

    func clearCaches() {
        ImagePipeline.shared.clear()
        Task { await ResponseCache.shared.removeAll() }
        pool = []
        invalidateRanking()
    }
}
