import Foundation

public enum SearchScope: String, CaseIterable, Hashable, Sendable {
    case all, songs, albums, artists, playlists

    public var title: String { rawValue.capitalized }
}

public enum SearchQuery {
    public static let minimumLength = 2

    public static func normalized(_ text: String) -> String? {
        let collapsed = text.split(whereSeparator: \.isWhitespace).joined(separator: " ")
        return collapsed.count >= minimumLength ? collapsed : nil
    }
}

public struct RecentSearches: Codable, Equatable, Sendable {
    public static let limit = 8

    public private(set) var terms: [String] = []

    public init() {}

    public mutating func add(_ text: String) {
        guard let term = SearchQuery.normalized(text) else { return }
        terms.removeAll { $0.caseInsensitiveCompare(term) == .orderedSame }
        terms.insert(term, at: 0)
        if terms.count > Self.limit { terms.removeLast(terms.count - Self.limit) }
    }

    public mutating func clear() { terms = [] }
}

public struct PagedResults<Element: Identifiable & Sendable>: Sendable {
    public let pageSize: Int
    public private(set) var items: [Element] = []
    public private(set) var total = 0
    public private(set) var pagesLoaded = 0

    public init(pageSize: Int) { self.pageSize = pageSize }

    public var hasMore: Bool { pagesLoaded * pageSize < total }
    public var nextPage: Int { pagesLoaded }

    public mutating func append(_ page: [Element], total: Int) {
        var seen = Set(items.map(\.id))
        items.append(contentsOf: page.filter { seen.insert($0.id).inserted })
        self.total = total
        pagesLoaded += 1
    }
}
