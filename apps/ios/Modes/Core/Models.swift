import Foundation
import ModesCore

struct AppSettings: Codable {
    var highQuality = false
    var languages: [String] = []     // empty until onboarding is done
    /// Pauses evidence collection only; playback, favorites, history and recents keep working.
    var personalizationPaused = false
}

struct EventRecord: Codable {
    var t = Date()
    var type: String
    var song: String?
    var frac: Double?
    var note: String?
}

/// MediaPlayer (imported by several files) also declares a `LibraryItem`; this makes the app-wide name unambiguous.
typealias LibraryItem = ModesCore.LibraryItem
