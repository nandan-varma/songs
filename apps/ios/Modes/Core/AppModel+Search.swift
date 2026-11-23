import Foundation
import ModesCore

extension AppModel {
    private static let recentSearchesURL: URL = {
        let directory = URL.applicationSupportDirectory
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory.appendingPathComponent("recent-searches-v1.plist")
    }()

    func loadRecentSearches() {
        guard FileManager.default.fileExists(atPath: Self.recentSearchesURL.path) else { return }
        do {
            recentSearches = try PropertyListDecoder().decode(RecentSearches.self, from: Data(contentsOf: Self.recentSearchesURL))
        } catch {
            AppLog.error("persistence", "recent searches unreadable: \(error)")
            recentSearchesBlocked = true
        }
    }

    func rememberSearch(_ text: String) {
        recentSearches.add(text)
        saveRecentSearches()
    }

    func clearRecentSearches() {
        recentSearches.clear()
        saveRecentSearches()
    }

    private func saveRecentSearches() {
        guard !recentSearchesBlocked else { return }
        let encoder = PropertyListEncoder()
        encoder.outputFormat = .binary
        do { try encoder.encode(recentSearches).write(to: Self.recentSearchesURL, options: .atomic) }
        catch { AppLog.error("persistence", "could not write recent searches: \(error)") }
    }

    func lyrics(for id: String) async -> String? {
        if let cached = lyricsCache[id] { return cached }
        guard let text = try? await SaavnAPI.lyrics(songID: id), !text.isEmpty else { return nil }
        lyricsCache[id] = text
        return text
    }
}
