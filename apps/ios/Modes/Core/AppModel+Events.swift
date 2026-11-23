import Foundation
import ModesCore

extension AppModel {
    static let logQueue = DispatchQueue(label: "modes.eventlog", qos: .utility)

    func flash(_ text: String) {
        toast = text
        toastTask?.cancel()
        toastTask = Task { try? await Task.sleep(for: .seconds(2.4)); if !Task.isCancelled { toast = nil } }
    }

    func log(_ type: String, song: String? = nil, frac: Double? = nil, note: String? = nil, item: QueueItem? = nil,
             record: ListenRecord? = nil) {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        guard var line = try? encoder.encode(EventRecord(type: type, song: song ?? item?.id, frac: frac, note: note,
                                                            source: item?.source, model: item.map { _ in ModelTag.current },
                                                            heard: record?.secondsHeard, pauses: record?.pauses,
                                                            seeksBack: record?.seeksBack, seeksForward: record?.seeksForward)) else { return }
        line.append(10)
        let url = Self.eventsURL, data = line
        Self.logQueue.async {
            do {
                if FileManager.default.fileExists(atPath: url.path) {
                    let handle = try FileHandle(forWritingTo: url)
                    defer { try? handle.close() }
                    try handle.seekToEnd()
                    try handle.write(contentsOf: data)
                } else { try data.write(to: url) }
            } catch {}
        }
    }
}
