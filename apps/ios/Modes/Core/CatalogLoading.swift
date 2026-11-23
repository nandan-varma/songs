import Foundation
import ModesCore

extension Catalog {
    /// Loads the catalog bundled with the app.
    convenience init() throws {
        guard let jsonURL = Bundle.main.url(forResource: "catalog", withExtension: "json"),
              let binURL = Bundle.main.url(forResource: "catalog", withExtension: "bin") else {
            throw NSError(domain: "Catalog", code: 1, userInfo: [NSLocalizedDescriptionKey: "catalog resources missing"])
        }
        try self.init(jsonURL: jsonURL, binURL: binURL)
    }
}
