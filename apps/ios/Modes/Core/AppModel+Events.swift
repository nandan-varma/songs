import Foundation
import ModesCore

extension AppModel {
    func flash(_ text: String) {
        toast = text
        toastTask?.cancel()
        toastTask = Task { try? await Task.sleep(for: .seconds(2.4)); if !Task.isCancelled { toast = nil } }
    }

    func log(_ type: String, song: String? = nil, frac: Double? = nil, note: String? = nil) {
        let enc = JSONEncoder(); enc.dateEncodingStrategy = .iso8601
        guard var line = try? enc.encode(EventRecord(profile: "listener", type: type, song: song, frac: frac, note: note)) else { return }
        line.append(10)
        let url = Self.eventsURL, data = line
        Self.logQueue.async {
            do {
                if FileManager.default.fileExists(atPath: url.path) {
                    let h = try FileHandle(forWritingTo: url); defer { try? h.close() }
                    try h.seekToEnd(); try h.write(contentsOf: data)
                } else { try data.write(to: url) }
            } catch {}
        }
    }

}
