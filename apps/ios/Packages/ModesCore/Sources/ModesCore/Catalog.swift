import Foundation

public struct CatalogItem: Sendable {
    public let id: String, title: String, artist: String, lang: String, year: Int, album: String, img: String

    public init(id: String, title: String, artist: String, lang: String, year: Int, album: String, img: String) {
        self.id = id; self.title = title; self.artist = artist; self.lang = lang; self.year = year; self.album = album; self.img = img
    }
}

/// The on-device song index: per-song feature vectors for the learner plus interpretable audio attributes.
public final class Catalog: Sendable {
    public let items: [CatalogItem]
    public let dim: Int
    public let attrDim: Int
    public let attrNames: [String]
    public let attrStd: [Double]
    public let langs: [String]
    public let features: [Float]        // count × dim
    public let attrs: [UInt8]           // count × attrDim, 0…255 for display
    public var attrStart: Int { dim - attrDim }
    public var count: Int { items.count }
    public let indexByID: [String: Int]
    /// Identifies this exact catalog build; saved learners are only valid against the catalog they were trained on.
    public let signature: String

    private struct Meta: Decodable {
        let count: Int, dim: Int, attrDim: Int
        let attrNames: [String]
        let attrStd: [Double]
        let langs: [String]?
        let items: [[Cell]]
    }
    private enum Cell: Decodable {
        case s(String), i(Int)
        init(from decoder: Decoder) throws {
            let c = try decoder.singleValueContainer()
            if let v = try? c.decode(Int.self) { self = .i(v) } else { self = .s(try c.decode(String.self)) }
        }
        var str: String { if case .s(let v) = self { return v } else { return "" } }
        var int: Int { if case .i(let v) = self { return v } else { return 0 } }
    }

    public init(jsonURL: URL, binURL: URL) throws {
        let meta = try JSONDecoder().decode(Meta.self, from: Data(contentsOf: jsonURL))
        guard meta.items.count == meta.count, meta.attrNames.count == meta.attrDim, meta.attrStd.count == meta.attrDim,
              meta.items.allSatisfy({ $0.count >= 6 }) else {
            throw NSError(domain: "Catalog", code: 2, userInfo: [NSLocalizedDescriptionKey: "catalog.json is inconsistent"])
        }
        items = meta.items.map { CatalogItem(id: $0[0].str, title: $0[1].str, artist: $0[2].str, lang: $0[3].str, year: $0[4].int, album: $0[5].str, img: $0.count > 6 ? $0[6].str : "") }
        dim = meta.dim; attrDim = meta.attrDim; attrNames = meta.attrNames
        attrStd = meta.attrStd.map { $0 > 1e-6 ? $0 : 1 }
        langs = meta.langs ?? []
        let data = try Data(contentsOf: binURL)
        let floatCount = meta.count * meta.dim
        guard data.count == floatCount * 2 + meta.count * meta.attrDim else {
            throw NSError(domain: "Catalog", code: 3, userInfo: [NSLocalizedDescriptionKey: "catalog.bin has the wrong size"])
        }
        var f = [Float](repeating: 0, count: floatCount)
        data.withUnsafeBytes { raw in
            let h = raw.bindMemory(to: Float16.self)
            for i in 0..<floatCount { f[i] = Float(h[i]) }
        }
        features = f
        attrs = [UInt8](data.suffix(from: floatCount * 2))
        indexByID = Dictionary(items.enumerated().map { ($1.id, $0) }, uniquingKeysWith: { first, _ in first })
        signature = "\(meta.count)-\(meta.dim)-\(items.first?.id ?? "")-\(items.last?.id ?? "")-\(meta.attrNames.joined(separator: ","))"
    }

    public func vector(_ i: Int) -> ArraySlice<Float> { features[(i * dim)..<((i + 1) * dim)] }
    public func attr(_ i: Int, _ k: Int) -> Double { Double(attrs[i * attrDim + k]) / 255 }
    public func attrIndex(_ name: String) -> Int? { attrNames.firstIndex(of: name) }
}
