import Foundation

struct Golden: Decodable {
    struct Entry: Decodable { let song: SongFeatures; let tokens: [[JSONValue]] }
    let songs: [Entry]
}
enum JSONValue: Decodable {
    case s(String), d(Double)
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let s = try? c.decode(String.self) { self = .s(s) } else { self = .d(try c.decode(Double.self)) }
    }
}

let data = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
let g = try JSONDecoder().decode(Golden.self, from: data)
var bad = 0
for e in g.songs {
    let s = e.song
    var exp: [String] = []
    for a in s.artistNames { exp.append("a|" + a) }
    for c in s.composer.split(separator: ",") {
        let n = c.trimmingCharacters(in: .whitespaces).lowercased()
        if !n.isEmpty { exp.append("m|" + n) }
    }
    if !s.album.isEmpty { exp.append("al|" + s.album.lowercased()) }
    if !s.label.isEmpty { exp.append("lb|" + s.label.lowercased()) }
    if !s.language.isEmpty { exp.append("lg|" + s.language.lowercased()) }
    if s.year > 0 { exp.append("y|\(s.year)"); exp.append("d|\(s.year / 5 * 5)") }
    if let p = s.artistNames.first, !s.language.isEmpty { exp.append("x|\(p)|\(s.language.lowercased())") }
    for w in s.titleWords { exp.append("w|" + w) }
    if s.explicit { exp.append("e|explicit") }
    let got = e.tokens.compactMap { t -> String? in if case .s(let x) = t[0] { return x } else { return nil } }
    if got != exp { bad += 1; print("MISMATCH", s.id, "\n swift:", exp, "\n golden:", got) }
}
print("checked", g.songs.count, "mismatches", bad)
