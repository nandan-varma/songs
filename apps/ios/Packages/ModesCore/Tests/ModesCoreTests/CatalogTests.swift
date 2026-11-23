import Foundation
import Testing
@testable import ModesCore

@Suite(.enabled(if: RealCatalog.available, "bundled catalog not found")) struct CatalogTests {
    @Test func loadsConsistently() throws {
        let c = try Catalog(jsonURL: RealCatalog.jsonURL, binURL: RealCatalog.binURL)
        #expect(c.count > 1000)
        #expect(c.features.count == c.count * c.dim)
        #expect(c.attrs.count == c.count * c.attrDim)
        #expect(c.attrNames.count == c.attrDim && c.attrStart == c.dim - c.attrDim)
        #expect(c.features.allSatisfy { $0.isFinite })
        #expect(Set(c.items.map(\.id)).count == c.count)
        for name in ["voice", "arousal", "hot", "recent", "lang:hindi"] { #expect(c.attrIndex(name) != nil, "missing attribute \(name)") }
    }

}
