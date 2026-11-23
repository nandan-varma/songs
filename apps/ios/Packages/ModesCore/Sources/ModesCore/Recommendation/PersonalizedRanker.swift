import Foundation

public struct RankedCandidate: Sendable {
    public let song: SongFeatures
    public let features: SparseFeatures
    public let source: String
    public let suggestionRanks: [Int]

    public init(song: SongFeatures, source: String, suggestionRanks: [Int] = [], encoder: SongEncoder) {
        self.song = song
        self.features = encoder.features(for: song)
        self.source = source
        self.suggestionRanks = suggestionRanks
    }

    public init(song: SongFeatures, features: SparseFeatures, source: String, suggestionRanks: [Int] = []) {
        self.song = song; self.features = features; self.source = source; self.suggestionRanks = suggestionRanks
    }
}

public enum SuggestionPrior {
    public static let weight: Float = 0.15
    public static let cap: Float = 0.5

    public static func bonus(ranks: [Int]) -> Float {
        let total = ranks.reduce(Float(0)) { $0 + 1 / (1 + Float(max(0, $1)) / 5) }
        return min(cap, weight * total)
    }
}

public struct RankedSong: Sendable, Identifiable {
    public let song: SongFeatures
    public let score: Float
    public let why: String
    public let source: String
    public var id: String { song.id }
}

public struct RankOptions: Sendable {
    public var count: Int
    public var excluded: Set<String>
    public var languages: Set<String>
    public var previousArtist: String
    public var explore: Float
    public var maxPerArtist: Int

    public init(count: Int, excluded: Set<String> = [], languages: Set<String> = [],
                previousArtist: String = "", explore: Float = 0, maxPerArtist: Int = 2) {
        self.count = count; self.excluded = excluded; self.languages = languages
        self.previousArtist = previousArtist; self.explore = explore; self.maxPerArtist = maxPerArtist
    }
}

public enum PersonalizedRanker {
    public static func rank<G: RandomNumberGenerator>(_ candidates: [RankedCandidate], profile: PersonalizedProfile,
                                                      options: RankOptions, using generator: inout G) -> [RankedSong] {
        var learner = profile.learner
        learner.fit(unlabeled: candidates.map(\.features))
        let banned = Set(profile.banned)
        let recent = Set(profile.recent.suffix(300))
        let previousArtist = options.previousArtist.lowercased()

        var scored: [(candidate: RankedCandidate, score: Float, position: Int)] = []
        for (position, candidate) in candidates.enumerated() {
            let song = candidate.song
            guard !banned.contains(song.id), !recent.contains(song.id), !options.excluded.contains(song.id) else { continue }
            if !options.languages.isEmpty, !options.languages.contains(song.language.lowercased()) { continue }
            let score = learner.sampleScore(candidate.features, temperature: options.explore, using: &generator)
                + SuggestionPrior.bonus(ranks: candidate.suggestionRanks)
            scored.append((candidate, score, position))
        }
        scored.sort { $0.score == $1.score ? $0.position < $1.position : $0.score > $1.score }

        var selected: [RankedSong] = []
        var duplicateKeys = Set<String>()
        var artistCounts: [String: Int] = [:]
        var lastArtist = previousArtist
        var lastAlbum = ""

        for entry in scored {
            guard selected.count < options.count else { break }
            let song = entry.candidate.song
            let artist = song.primaryArtist.lowercased()
            let album = song.album.lowercased()
            let duplicateKey = song.title.lowercased() + "|" + artist
            if artist == lastArtist, !artist.isEmpty { continue }
            if !album.isEmpty, album == lastAlbum { continue }
            if artistCounts[artist, default: 0] >= options.maxPerArtist { continue }
            guard duplicateKeys.insert(duplicateKey).inserted else { continue }

            selected.append(RankedSong(song: song, score: entry.score,
                                       why: learner.explanation(for: entry.candidate.features) ?? "Based on what you play",
                                       source: entry.candidate.source))
            artistCounts[artist, default: 0] += 1
            lastArtist = artist
            lastAlbum = album
        }
        return selected
    }
}
