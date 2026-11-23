import Foundation
import ModesCore

enum Appearance: String, Codable, CaseIterable {
    case system, light, dark

    var title: String { rawValue.capitalized }
}

struct Labs: Codable, Equatable {
    var radioStations = true
    var syncedLyrics = true
    var genrePages = true
    var moreLike = true
    var launchShelves = true

    init() {}

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        func value(_ key: CodingKeys, _ fallback: Bool) -> Bool { (try? container.decodeIfPresent(Bool.self, forKey: key)) ?? fallback }
        radioStations = value(.radioStations, true)
        syncedLyrics = value(.syncedLyrics, true)
        genrePages = value(.genrePages, true)
        moreLike = value(.moreLike, true)
        launchShelves = value(.launchShelves, true)
    }
}

struct AppSettings: Codable, Equatable {
    var languages: [String] = []
    var personalizationPaused = false
    var showWhy = true
    var wifiQuality = QualityPreference.high
    var cellularQuality = QualityPreference.normal
    var dataSaver = false
    var autoplay = true
    var allowExplicit = true
    var resumeOnLaunch = true
    var appearance = Appearance.system
    var haptics = true
    var tintedPlayer = true
    var labs = Labs()

    init() {}

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        func value<T: Decodable>(_ key: CodingKeys, _ fallback: T) -> T {
            (try? container.decodeIfPresent(T.self, forKey: key)) ?? fallback
        }
        languages = value(.languages, languages)
        personalizationPaused = value(.personalizationPaused, personalizationPaused)
        showWhy = value(.showWhy, showWhy)
        wifiQuality = value(.wifiQuality, wifiQuality)
        cellularQuality = value(.cellularQuality, cellularQuality)
        dataSaver = value(.dataSaver, dataSaver)
        autoplay = value(.autoplay, autoplay)
        allowExplicit = value(.allowExplicit, allowExplicit)
        resumeOnLaunch = value(.resumeOnLaunch, resumeOnLaunch)
        appearance = value(.appearance, appearance)
        haptics = value(.haptics, haptics)
        tintedPlayer = value(.tintedPlayer, tintedPlayer)
        labs = value(.labs, labs)
    }
}

struct EventRecord: Codable {
    var t = Date()
    var type: String
    var song: String?
    var frac: Double?
    var note: String?
    var source: String?
    var model: String?
    var heard: Double?
    var pauses: Int?
    var seeksBack: Int?
    var seeksForward: Int?
}

typealias LibraryItem = ModesCore.LibraryItem
