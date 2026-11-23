import Foundation

public enum QualityPreference: String, Codable, CaseIterable, Sendable {
    case low, normal, high, auto

    public var title: String {
        switch self {
        case .low: "Low (96 kbps)"
        case .normal: "Normal (160 kbps)"
        case .high: "High (320 kbps)"
        case .auto: "Highest available"
        }
    }

    var target: Int {
        switch self {
        case .low: 96
        case .normal: 160
        case .high: 320
        case .auto: Int.max
        }
    }
}

public enum NetworkKind: Sendable {
    case wifi, cellular
}

public enum StreamQuality {
    public static func pick(preference: QualityPreference, available: [Int]) -> Int? {
        guard let lowest = available.min() else { return nil }
        return available.filter { $0 <= preference.target }.max() ?? lowest
    }

    public static func preference(wifi: QualityPreference, cellular: QualityPreference,
                                  network: NetworkKind, dataSaver: Bool) -> QualityPreference {
        switch network {
        case .wifi: wifi
        case .cellular: dataSaver ? .low : cellular
        }
    }

    public static func bitrate(of label: String) -> Int? {
        Int(label.prefix { $0.isNumber })
    }
}
