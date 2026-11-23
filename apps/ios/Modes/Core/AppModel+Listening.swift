import Foundation
import ModesCore

private enum ListeningFile {
    static let version = 1

    struct Payload: Codable {
        var version = ListeningFile.version
        var stats: ListeningStats
    }

    static let url: URL = {
        let directory = URL.applicationSupportDirectory
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory.appendingPathComponent("listening-v1.plist")
    }()
}

extension AppModel {
    static func outcome(_ reason: CloseReason) -> ListenRecord.Outcome {
        switch reason {
        case .completed: .completed
        case .skipped: .skipped
        case .rejected: .rejected
        case .switched: .switched
        }
    }

    func loadListening() {
        let url = ListeningFile.url
        guard FileManager.default.fileExists(atPath: url.path) else { return }
        do {
            let payload = try PropertyListDecoder().decode(ListeningFile.Payload.self, from: Data(contentsOf: url))
            guard payload.version == ListeningFile.version else { throw CocoaError(.fileReadCorruptFile) }
            listening = payload.stats
        } catch {
            AppLog.error("persistence", "listening stats unreadable, moving them aside: \(error)")
            let aside = url.deletingLastPathComponent().appendingPathComponent("listening-v1.unreadable-\(Int(Date().timeIntervalSince1970)).plist")
            do { try FileManager.default.moveItem(at: url, to: aside) } catch { listeningBlocked = true }
        }
    }

    func scheduleListeningSave() {
        listeningSaveTask?.cancel()
        listeningSaveTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(5))
            guard !Task.isCancelled else { return }
            self?.saveListeningNow()
        }
    }

    func saveListeningNow() {
        guard !listeningBlocked else { return }
        let payload = ListeningFile.Payload(stats: listening)
        Task.detached(priority: .utility) {
            let encoder = PropertyListEncoder()
            encoder.outputFormat = .binary
            do { try encoder.encode(payload).write(to: ListeningFile.url, options: .atomic) }
            catch { AppLog.error("persistence", "could not write listening stats: \(error)") }
        }
    }

    func resetListening() {
        listening = ListeningStats()
        saveListeningNow()
    }
}
