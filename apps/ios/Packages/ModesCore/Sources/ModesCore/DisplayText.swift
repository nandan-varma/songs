import Foundation

/// Small, pure text clean-up used by everything the app shows: HTML entities, whitespace and typographic quotes.
public enum DisplayText {
    /// Decodes HTML entities (`&quot;`, `&amp;`, `&#039;`, `&#x27;`, `&lt;`, `&gt;`, `&nbsp;`), folds every run of whitespace
    /// (including non-breaking spaces and newlines) into one space and trims the ends. Zero-width joiners are kept, because
    /// Indic scripts need them.
    public static func clean(_ input: String) -> String {
        let decoded = decodeEntities(input)
        let scalars = decoded.unicodeScalars.filter { $0.value != 0x200B && $0.value != 0xFEFF }
        let text = String(String.UnicodeScalarView(scalars))
        return text.split(whereSeparator: \.isWhitespace).joined(separator: " ")
    }

    /// Decodes entities, repeating once for double-encoded text such as `&amp;quot;`.
    public static func decodeEntities(_ input: String) -> String {
        var s = input
        for _ in 0..<2 {
            guard s.contains("&") else { break }
            let decoded = decodeOnce(s)
            if decoded == s { break }
            s = decoded
        }
        return s
    }

    private static let named: [String: Character] = ["quot": "\"", "amp": "&", "apos": "'", "lt": "<", "gt": ">", "nbsp": " ", "ldquo": "“", "rdquo": "”", "lsquo": "‘", "rsquo": "’"]

    private static func decodeOnce(_ s: String) -> String {
        var out = ""
        out.reserveCapacity(s.count)
        var i = s.startIndex
        while i < s.endIndex {
            let ch = s[i]
            if ch == "&", let semi = s[i...].prefix(10).firstIndex(of: ";"), let decoded = entity(s[s.index(after: i)..<semi]) {
                out.append(decoded)
                i = s.index(after: semi)
                continue
            }
            out.append(ch)
            i = s.index(after: i)
        }
        return out
    }

    private static func entity(_ name: Substring) -> Character? {
        if let c = named[String(name)] { return c }
        guard name.hasPrefix("#"), name.count > 1 else { return nil }
        let digits = name.dropFirst()
        let value: UInt32?
        if digits.hasPrefix("x") || digits.hasPrefix("X") { value = UInt32(digits.dropFirst(), radix: 16) } else { value = UInt32(digits) }
        guard let value, value > 0, let scalar = Unicode.Scalar(value) else { return nil }
        return Character(scalar)
    }

    /// Straight quotes become typographic ones: “double”, ‘single’ and apostrophes (don’t, ’90s).
    public static func typographic(_ s: String) -> String {
        guard s.contains(where: { $0 == "\"" || $0 == "'" }) else { return s }
        let chars = Array(s)
        var out = ""
        out.reserveCapacity(s.count)
        for (i, c) in chars.enumerated() {
            let prev: Character? = i > 0 ? chars[i - 1] : nil
            switch c {
            case "\"":
                out.append(opensQuote(after: prev) ? "“" : "”")
            case "'":
                if opensQuote(after: prev) {
                    let next: Character? = i + 1 < chars.count ? chars[i + 1] : nil
                    out.append(next?.isNumber == true ? "’" : "‘")   // ’90s is an apostrophe, ‘Tis a quote
                } else {
                    out.append("’")
                }
            default:
                out.append(c)
            }
        }
        return out
    }

    private static func opensQuote(after previous: Character?) -> Bool {
        guard let previous else { return true }
        return previous.isWhitespace || "([{–—“‘".contains(previous)
    }

    /// Case, accent and width insensitive form for comparing two titles.
    static func fold(_ s: String) -> String {
        s.folding(options: [.caseInsensitive, .diacriticInsensitive, .widthInsensitive], locale: nil)
    }
}
