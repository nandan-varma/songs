import Foundation
import ModesCore

extension SongEncoder {
    static func bundled() -> SongEncoder {
        guard let table = Bundle.main.url(forResource: "table_fp16", withExtension: "bin"),
              let vocabulary = Bundle.main.url(forResource: "vocab", withExtension: "json") else {
            preconditionFailure("encoder resources are missing from the app bundle")
        }
        do {
            return SongEncoder(item: try ItemEncoder(table: Data(contentsOf: table, options: .alwaysMapped),
                                                     vocabulary: Data(contentsOf: vocabulary)))
        } catch {
            preconditionFailure("encoder resources are unreadable: \(error)")
        }
    }
}
