import Foundation
import ModesCore

struct AppSettings: Codable {
    var baseURL = "https://saavn-api.nandanvarma.com"
    var highQuality = false
    var languages: [String] = []     // empty until onboarding is done
    /// Pauses evidence collection only; playback, favorites, history and recents keep working.
    var personalizationPaused = false
}

struct CandidateHit: Sendable {
    let song: SaavnAPI.Song
    let source: String
}

struct EventRecord: Codable {
    var t = Date()
    var profile: String
    var type: String
    var song: String?
    var frac: Double?
    var note: String?
}

struct Resolved: Sendable {
    let id: String
    let url: URL
    let image: URL?
    let duration: Double
}

/// MediaPlayer (imported by several files) also declares a `LibraryItem`; this makes the app-wide name unambiguous.
typealias LibraryItem = ModesCore.LibraryItem
