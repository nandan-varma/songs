import ModesCore
import Observation

@MainActor @Observable
final class PagedSearch<Item: Identifiable & Sendable> {
    typealias Load = @Sendable (String, Int) async throws -> SaavnAPI.SearchPage<Item>

    private(set) var results = PagedResults<Item>(pageSize: SaavnAPI.pageSize)
    private(set) var loading = false
    private(set) var failed = false
    private var query = ""
    private var generation = 0

    func reload(_ query: String, load: Load) async {
        generation += 1
        let mine = generation
        loading = true
        failed = false
        do {
            let page = try await load(query, 0)
            guard mine == generation, !Task.isCancelled else { return }
            var fresh = PagedResults<Item>(pageSize: SaavnAPI.pageSize)
            fresh.append(page.items, total: page.total)
            results = fresh
            self.query = query
        } catch {
            guard mine == generation, !Task.isCancelled else { return }
            failed = true
        }
        loading = false
    }

    func more(load: Load) async {
        guard !loading, results.hasMore else { return }
        let mine = generation
        loading = true
        if let page = try? await load(query, results.nextPage), mine == generation {
            results.append(page.items, total: page.total)
        }
        if mine == generation { loading = false }
    }
}

@MainActor @Observable
final class OverviewSearch {
    private(set) var overview: SaavnAPI.SearchOverview?
    private(set) var loadedQuery = ""
    private(set) var loading = false
    private(set) var failed = false
    private var generation = 0

    func reload(_ query: String, delivery: Delivery) async {
        generation += 1
        let mine = generation
        loading = true
        failed = false
        do {
            let found = try await SaavnAPI.search(query, delivery: delivery)
            guard mine == generation, !Task.isCancelled else { return }
            overview = found
            loadedQuery = query
        } catch {
            guard mine == generation, !Task.isCancelled else { return }
            failed = true
        }
        loading = false
    }
}
