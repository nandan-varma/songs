import Foundation

public struct SongTitle: Equatable, Sendable {
    public let title: String

    public let context: String?

    public init(title: String, context: String? = nil) {
        self.title = title
        self.context = context
    }

    public static func parse(_ raw: String, album: String? = nil) -> SongTitle {
        let cleanedRaw = DisplayText.clean(raw)
        let stripped = strip(cleanedRaw)
        var title = tidy(stripped.text)
        if title.isEmpty { title = cleanedRaw }
        if title.isEmpty { return SongTitle(title: raw) }

        var context: String?
        if let film = stripped.film.flatMap(normalizedContext), DisplayText.fold(film) != DisplayText.fold(title) {
            context = film
        } else if stripped.film == nil, let album {
            context = albumContext(album, title: title)
        }
        return SongTitle(title: DisplayText.typographic(title), context: context.map(DisplayText.typographic))
    }

    private struct Stripped { var text: String; var film: String? }

    private enum Group { case from(String, rest: String), noise, keep }

    private static func strip(_ s: String) -> Stripped {
        var film: String?
        var out = ""
        let chars = Array(s)
        var i = 0
        while i < chars.count {
            let c = chars[i]
            if c == "(" || c == "[", let end = closing(chars, from: i) {
                let inner = String(chars[(i + 1)..<end]).trimmingCharacters(in: .whitespaces)
                switch classify(inner) {
                case .from(let name, let rest):
                    if film == nil { film = name }
                    if !rest.isEmpty { out += " (\(rest))" }
                case .noise:
                    break
                case .keep:

                    let nested = strip(inner)
                    if film == nil { film = nested.film }
                    let text = tidy(nested.text)
                    if !text.isEmpty { out += "(\(text))" }
                }
                i = end + 1
                continue
            }
            out.append(c)
            i += 1
        }
        out = out.split(separator: " ", omittingEmptySubsequences: true).joined(separator: " ")

        while let range = out.range(of: " - ", options: .backwards) ?? out.range(of: " – ", options: .backwards) ?? out.range(of: " — ", options: .backwards) {
            let tail = out[range.upperBound...].trimmingCharacters(in: .whitespaces)
            if isSoundtrackNoise(tail) {
                out = String(out[..<range.lowerBound])
            } else if let (name, _) = fromName(tail) {
                if film == nil { film = name }
                out = String(out[..<range.lowerBound])
            } else {
                break
            }
        }
        return Stripped(text: out, film: film)
    }

    private static func closing(_ chars: [Character], from start: Int) -> Int? {
        var depth = 0
        for i in start..<chars.count {
            switch chars[i] {
            case "(", "[": depth += 1
            case ")", "]":
                depth -= 1
                if depth == 0 { return i }
            default: break
            }
        }
        return nil
    }

    private static func classify(_ inner: String) -> Group {
        if isSoundtrackNoise(inner) { return .noise }
        if let (name, rest) = fromName(inner) { return .from(name, rest: rest) }
        return .keep
    }

    private static func fromName(_ s: String) -> (name: String, rest: String)? {
        let normalized = straightQuotes(s)
        let lower = normalized.lowercased()
        guard lower.hasPrefix("from ") || lower.hasPrefix("from\"") || lower.hasPrefix("from'") else { return nil }
        var rest = normalized.dropFirst(4).trimmingCharacters(in: .whitespaces)
        for article in ["the movie ", "the film ", "the album ", "the series ", "movie ", "film ", "album ", "series "] where rest.lowercased().hasPrefix(article) {
            rest = String(rest.dropFirst(article.count)).trimmingCharacters(in: .whitespaces)
            break
        }
        let quotes = CharacterSet(charactersIn: "\"'")
        while let f = rest.unicodeScalars.first, quotes.contains(f) { rest.removeFirst() }
        var after = ""
        if let close = rest.lastIndex(of: "\"") {
            after = String(rest[rest.index(after: close)...])
            rest = String(rest[..<close])
        } else {
            rest = rest.trimmingCharacters(in: quotes)
        }
        let name = rest.replacingOccurrences(of: "\"", with: "").trimmingCharacters(in: .whitespaces)
        let leftover = after.trimmingCharacters(in: CharacterSet.whitespaces.union(CharacterSet(charactersIn: "/-–—,|\"'")))
        return name.isEmpty ? nil : (name, leftover)
    }

    private static func isSoundtrackNoise(_ s: String) -> Bool {
        var lower = straightQuotes(s).lowercased().trimmingCharacters(in: CharacterSet.whitespaces.union(CharacterSet(charactersIn: "\"")))
        lower = lower.split(separator: " ").joined(separator: " ")
        if lower == "ost" || lower == "soundtrack" || lower == "original score" { return true }
        if lower.hasPrefix("original"), lower.hasSuffix("soundtrack") || lower.hasSuffix("score") { return true }
        if lower.hasPrefix("from the original"), lower.hasSuffix("soundtrack") || lower.hasSuffix("score") { return true }
        if lower.hasPrefix("motion picture"), lower.hasSuffix("soundtrack") || lower.hasSuffix("score") { return true }
        return false
    }

    private static func straightQuotes(_ s: String) -> String {
        var out = s
        for q in ["“", "”", "„", "‟", "«", "»", "″"] { out = out.replacingOccurrences(of: q, with: "\"") }
        return out
    }

    private static func tidy(_ s: String) -> String {
        var t = s.replacingOccurrences(of: "()", with: "").replacingOccurrences(of: "[]", with: "")
        t = t.split(separator: " ", omittingEmptySubsequences: true).joined(separator: " ")
        let junk = CharacterSet.whitespaces.union(CharacterSet(charactersIn: "-–—|,:;"))
        return t.trimmingCharacters(in: junk)
    }

    private static func normalizedContext(_ name: String) -> String? {
        let inner = strip(DisplayText.clean(name))
        let result = tidy(inner.text)
        return result.isEmpty ? nil : result
    }

    private static func albumContext(_ album: String, title: String) -> String? {
        let parsed = strip(DisplayText.clean(album))
        let candidate = parsed.film.flatMap(normalizedContext) ?? tidy(parsed.text)
        guard candidate.count >= 2 else { return nil }
        let a = DisplayText.fold(candidate), t = DisplayText.fold(title)
        if a == t { return nil }
        if a.count >= 3, t.count >= 3, a.contains(t) || t.contains(a) { return nil }
        return candidate
    }
}
