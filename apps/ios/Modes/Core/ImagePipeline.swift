import UIKit

final class ImagePipeline: @unchecked Sendable {
    static let shared = ImagePipeline()

    private final class Memory: @unchecked Sendable {
        let cache = NSCache<NSURL, UIImage>()
        init() { cache.countLimit = 300 }
    }

    private let memory = Memory()
    private let session: URLSession
    private var inflight: [URL: Task<UIImage?, Never>] = [:]
    private let lock = NSLock()

    private init() {
        let directory = URL.cachesDirectory.appending(path: "artwork")
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let configuration = URLSessionConfiguration.default
        configuration.urlCache = URLCache(memoryCapacity: 64 * 1024 * 1024,
                                          diskCapacity: 256 * 1024 * 1024,
                                          directory: directory)
        configuration.requestCachePolicy = .returnCacheDataElseLoad
        configuration.timeoutIntervalForRequest = 20
        session = URLSession(configuration: configuration)
    }

    var diskUsage: Int { session.configuration.urlCache?.currentDiskUsage ?? 0 }

    func clear() {
        session.configuration.urlCache?.removeAllCachedResponses()
        memory.cache.removeAllObjects()
    }

    func cached(_ url: URL?) -> UIImage? {
        guard let url else { return nil }
        return memory.cache.object(forKey: url as NSURL)
    }

    func image(for url: URL) async -> UIImage? {
        if let hit = memory.cache.object(forKey: url as NSURL) { return hit }
        if let existing = task(for: url) { return await existing.value }
        let task: Task<UIImage?, Never> = Task.detached(priority: .userInitiated) { [session, memory] in
            var request = URLRequest(url: url)
            request.cachePolicy = .returnCacheDataElseLoad
            guard let (data, _) = try? await session.data(for: request),
                  let image = UIImage(data: data) else { return nil }
            let prepared = await image.byPreparingForDisplay() ?? image
            memory.cache.setObject(prepared, forKey: url as NSURL)
            return prepared
        }
        store(task, for: url)
        let image = await task.value
        removeTask(for: url)
        return image
    }

    func prefetch(_ urls: [URL]) {
        for url in urls where memory.cache.object(forKey: url as NSURL) == nil {
            Task { _ = await image(for: url) }
        }
    }

    private func task(for url: URL) -> Task<UIImage?, Never>? {
        lock.lock(); defer { lock.unlock() }
        return inflight[url]
    }

    private func store(_ task: Task<UIImage?, Never>, for url: URL) {
        lock.lock(); defer { lock.unlock() }
        inflight[url] = task
    }

    private func removeTask(for url: URL) {
        lock.lock(); defer { lock.unlock() }
        inflight[url] = nil
    }
}
