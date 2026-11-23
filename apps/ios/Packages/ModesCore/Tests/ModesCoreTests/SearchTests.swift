import Foundation
import Testing
@testable import ModesCore

struct SearchTests {
    @Test func queriesAreTrimmedCollapsedAndLengthChecked() {
        #expect(SearchQuery.normalized("  arijit   singh ") == "arijit singh")
        #expect(SearchQuery.normalized(" a ") == nil)
        #expect(SearchQuery.normalized("   ") == nil)
    }

    @Test func recentsDedupeIgnoringCaseAndKeepNewestFirst() {
        var recents = RecentSearches()
        recents.add("Kesariya"); recents.add("arijit"); recents.add("kesariya")
        #expect(recents.terms == ["kesariya", "arijit"])
    }

    @Test func recentsAreCappedAndIgnoreShortTerms() {
        var recents = RecentSearches()
        for index in 0..<12 { recents.add("term \(index)") }
        recents.add("x")
        #expect(recents.terms.count == RecentSearches.limit)
        #expect(recents.terms.first == "term 11")
        recents.clear()
        #expect(recents.terms.isEmpty)
    }

    @Test func recentsRoundTrip() throws {
        var recents = RecentSearches()
        recents.add("tum hi ho")
        let back = try PropertyListDecoder().decode(RecentSearches.self, from: PropertyListEncoder().encode(recents))
        #expect(back == recents)
    }

    private struct Card: Identifiable, Sendable { let id: String }

    @Test func pagesAppendWithoutDuplicatesAndKnowWhenToStop() {
        var results = PagedResults<Card>(pageSize: 2)
        results.append([Card(id: "a"), Card(id: "b")], total: 3)
        #expect(results.hasMore && results.nextPage == 1)
        results.append([Card(id: "b"), Card(id: "c")], total: 3)
        #expect(results.items.map(\.id) == ["a", "b", "c"])
        #expect(!results.hasMore)
    }
}
