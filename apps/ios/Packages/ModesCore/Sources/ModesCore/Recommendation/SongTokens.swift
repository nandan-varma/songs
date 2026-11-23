import Foundation

extension SongFeatures {
    public var tokens: [(token: String, weight: Float)] {
        var out: [(String, Float)] = []
        for artist in artistNames { out.append(("a|" + artist, 0.50)) }
        for name in composer.split(separator: ",") {
            let trimmed = name.trimmingCharacters(in: .whitespaces).lowercased()
            if !trimmed.isEmpty { out.append(("m|" + trimmed, 0.25)) }
        }
        if !album.isEmpty { out.append(("al|" + album.lowercased(), 1.0)) }
        if !label.isEmpty { out.append(("lb|" + label.lowercased(), 0.50)) }
        if !language.isEmpty { out.append(("lg|" + language.lowercased(), 0.50)) }
        if year > 0 {
            out.append(("y|\(year)", 0.25))
            out.append(("d|\(year / 5 * 5)", 0.50))
        }
        if let primary = artistNames.first, !language.isEmpty {
            out.append(("x|\(primary)|\(language.lowercased())", 0.50))
        }
        for word in titleWords { out.append(("w|" + word, 0.50)) }
        if explicit { out.append(("e|explicit", 0.10)) }
        return out
    }
}
