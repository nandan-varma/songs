import Foundation

/// Formats the artist line: "A", "A & B", "A, B & C", and a compact "A, B +1" for narrow rows.
public enum ArtistLine {
    /// Splits a raw credit such as `"A, B &amp; C"` into distinct names, in order.
    public static func names(from raw: String) -> [String] {
        let text = DisplayText.clean(raw)
            .replacingOccurrences(of: " & ", with: ",")
            .replacingOccurrences(of: ";", with: ",")
        var seen = Set<String>()
        var result: [String] = []
        for part in text.split(separator: ",") {
            let name = part.trimmingCharacters(in: .whitespaces)
            guard !name.isEmpty, seen.insert(DisplayText.fold(name)).inserted else { continue }
            result.append(name)
        }
        return result
    }

    /// "A", "A & B", "A, B & C".
    public static func format(_ names: [String]) -> String {
        switch names.count {
        case 0: return ""
        case 1: return names[0]
        case 2: return "\(names[0]) & \(names[1])"
        default: return names.dropLast().joined(separator: ", ") + " & " + names[names.count - 1]
        }
    }

    /// "A, B +1": the first `visible` names and how many more there are. Two or fewer names read in full.
    public static func compact(_ names: [String], visible: Int = 2) -> String {
        let shown = max(1, visible)
        guard names.count > max(2, shown) else { return format(names) }
        return names.prefix(shown).joined(separator: ", ") + " +\(names.count - shown)"
    }

    /// The raw credit, formatted in full.
    public static func display(_ raw: String) -> String { format(names(from: raw)) }

    /// The raw credit, in the compact form.
    public static func compact(_ raw: String, visible: Int = 2) -> String { compact(names(from: raw), visible: visible) }
}
