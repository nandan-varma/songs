import Foundation
import ModesCore

private struct PersistedState: Codable {
    static let currentVersion = 3

    var version = currentVersion
    var profile: PersonalizedProfile
    var settings: AppSettings
    var library: LibraryState
    var playlists: [LocalPlaylist]
}

extension AppModel {
    private static let stateURL: URL = {
        let directory = URL.applicationSupportDirectory
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory.appendingPathComponent("listener-v3.plist")
    }()

    static var eventsURL: URL { URL.documentsDirectory.appending(path: "events.jsonl") }

    func loadState() {
        guard FileManager.default.fileExists(atPath: Self.stateURL.path) else { return }
        do {
            let state = try PropertyListDecoder().decode(PersistedState.self, from: Data(contentsOf: Self.stateURL))
            guard state.version == PersistedState.currentVersion else { throw CocoaError(.fileReadCorruptFile) }
            profile = state.profile
            settings = state.settings
            library = state.library
            playlists = state.playlists
        } catch {
            let aside = Self.stateURL.deletingLastPathComponent()
                .appendingPathComponent("listener-v3.unreadable-\(Int(Date().timeIntervalSince1970)).plist")
            AppLog.error("persistence", "state unreadable, moving it aside: \(error)")
            do { try FileManager.default.moveItem(at: Self.stateURL, to: aside) }
            catch { persistenceBlocked = true }
        }
    }

    func scheduleSave() {
        saveTask?.cancel()
        saveTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(1.5))
            guard !Task.isCancelled else { return }
            self?.saveNow()
        }
    }

    func saveNow() {
        guard !persistenceBlocked else { return }
        let state = PersistedState(profile: profile, settings: settings, library: library, playlists: playlists)
        let encoder = PropertyListEncoder()
        encoder.outputFormat = .binary
        do { try encoder.encode(state).write(to: Self.stateURL, options: .atomic) }
        catch { AppLog.error("persistence", "could not write state: \(error)") }
    }
}
