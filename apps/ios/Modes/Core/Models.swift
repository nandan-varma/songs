import Foundation
import ModesCore

struct AppSettings: Codable {
    var highQuality = false
    var languages: [String] = []

    var personalizationPaused = false
}

struct EventRecord: Codable {
    var t = Date()
    var type: String
    var song: String?
    var frac: Double?
    var note: String?
}

typealias LibraryItem = ModesCore.LibraryItem
