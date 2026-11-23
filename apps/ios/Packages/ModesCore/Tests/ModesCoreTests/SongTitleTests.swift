import Foundation
import Testing
@testable import ModesCore

struct TitleCase: Sendable, CustomTestStringConvertible {
    let raw: String
    let title: String
    let context: String?
    var album: String? = nil
    var testDescription: String { raw }
}

@Suite struct SongTitleTests {
    static let cases: [TitleCase] = [
        // Hindi
        .init(raw: "Kesariya (From \"Brahmastra\")", title: "Kesariya", context: "Brahmastra"),
        .init(raw: "Satranga (From \"ANIMAL\")", title: "Satranga", context: "ANIMAL"),
        .init(raw: "Deewaniyat (From \"Ek Deewane Ki Deewaniyat\") (Original Motion Picture Soundtrack)", title: "Deewaniyat", context: "Ek Deewane Ki Deewaniyat"),
        .init(raw: "Jadu Prajapati (From \"Baba\") - Original Motion Picture Soundtrack", title: "Jadu Prajapati", context: "Baba"),
        .init(raw: "Shyamameghame ( From \"Adhipan\") (Original Motion Picture Soundtrack)", title: "Shyamameghame", context: "Adhipan"),
        // Telugu / Tamil
        .init(raw: "Naacho Naacho (From \"Rrr\")", title: "Naacho Naacho", context: "Rrr"),
        .init(raw: "Whistle Podu (From \"The Greatest Of All Time\")", title: "Whistle Podu", context: "The Greatest Of All Time"),
        .init(raw: "Enna Solla (The New Life of Tamizh)", title: "Enna Solla (The New Life of Tamizh)", context: nil),
        // Malayalam dash form
        .init(raw: "Kannil Pettole - From \"Thallumaala\"", title: "Kannil Pettole", context: "Thallumaala"),
        .init(raw: "Grudge Song - From “Thallumaala” - Original Motion Picture Soundtrack", title: "Grudge Song", context: "Thallumaala"),
        // Entities
        .init(raw: "Dada Dhamaka (From &quot;Dada&quot;)", title: "Dada Dhamaka", context: "Dada"),
        .init(raw: "Tum Hi Ho (From &#039;Aashiqui 2&#039;)", title: "Tum Hi Ho", context: "Aashiqui 2"),
        .init(raw: "Rock &amp; Roll", title: "Rock & Roll", context: nil),
        .init(raw: "Love &lt;3 &gt; Hate", title: "Love <3 > Hate", context: nil),
        .init(raw: "Jack &amp;amp; Jill", title: "Jack & Jill", context: nil),
        // Typographic quote variants
        .init(raw: "Naacho Naacho (From “Rrr”)", title: "Naacho Naacho", context: "Rrr"),
        .init(raw: "Heeriye (From „Race“)", title: "Heeriye", context: "Race"),
        // Square brackets
        .init(raw: "Soul of Doctor (Theme) [From \"Doctor\"]", title: "Soul of Doctor (Theme)", context: "Doctor"),
        // Nested parentheses
        .init(raw: "Tera Ban Jaunga (From \"Kabir Singh (Hindi)\")", title: "Tera Ban Jaunga", context: "Kabir Singh (Hindi)"),
        .init(raw: "Lo-fi Mix (Slow (Reverb))", title: "Lo-fi Mix (Slow (Reverb))", context: nil),
        // Soundtrack noise without a film
        .init(raw: "Heege Doora (Original Motion Picture Soundtrack)", title: "Heege Doora", context: nil),
        .init(raw: "Theme Music - OST", title: "Theme Music", context: nil),
        .init(raw: "Bgm (OST)", title: "Bgm", context: nil),
        // Meaningful suffixes survive
        .init(raw: "Apna Bana Le (Remix) (From \"Bhediya\")", title: "Apna Bana Le (Remix)", context: "Bhediya"),
        .init(raw: "Naanaadada Maathellava (Lofi)", title: "Naanaadada Maathellava (Lofi)", context: nil),
        .init(raw: "Raghu Pinjryat Ala (feat. Daisy Shah)", title: "Raghu Pinjryat Ala (feat. Daisy Shah)", context: nil),
        .init(raw: "Tum Mile - Slowed", title: "Tum Mile - Slowed", context: nil),
        .init(raw: "Chamkeela Angeelesi - Rainy Lofi", title: "Chamkeela Angeelesi - Rainy Lofi", context: nil),
        .init(raw: "Mothura | Coke Studio Bangla", title: "Mothura | Coke Studio Bangla", context: nil),
        .init(raw: "Naatu (Lo-fi) - From \"Rrr\"", title: "Naatu (Lo-fi)", context: "Rrr"),
        // Whitespace
        .init(raw: "  Chaleya   (From   \"Jawan\")  ", title: "Chaleya", context: "Jawan"),
        .init(raw: "Tera\u{00A0}Yaar\n(From \"Dhurandhar\")", title: "Tera Yaar", context: "Dhurandhar"),
        // Typographic quotes in kept text
        .init(raw: "Don't Stop \"Believin'\"", title: "Don’t Stop “Believin’”", context: nil),
        // Context from the album when the title names no film
        .init(raw: "Kesariya", title: "Kesariya", context: "Brahmastra", album: "Brahmastra (Original Motion Picture Soundtrack)"),
        .init(raw: "Naatu", title: "Naatu", context: "Rrr", album: "Rrr (From \"Rrr\")"),
        .init(raw: "Ranihaar", title: "Ranihaar", context: nil, album: "Ranihaar"),
        .init(raw: "Ek Din Pakhi Ure Jabe", title: "Ek Din Pakhi Ure Jabe", context: nil, album: "Ek Din Pakhi Ure Jabe - Kishore Kumar"),
        .init(raw: "Valayapatti", title: "Valayapatti", context: "Azagiya Tamil Magan", album: "Azagiya Tamil Magan"),
        .init(raw: "Bhool Bhulaiyaa (From \"Bhool Bhulaiyaa\")", title: "Bhool Bhulaiyaa", context: nil, album: "Bhool Bhulaiyaa"),
        // Film named in the title wins over the album
        .init(raw: "Heeriye (From \"Race\")", title: "Heeriye", context: "Race", album: "Hits 2024"),
    ]

    @Test(arguments: cases) func parses(_ c: TitleCase) {
        let r = SongTitle.parse(c.raw, album: c.album)
        #expect(r.title == c.title)
        #expect(r.context == c.context)
    }

    @Test func neverReturnsAnEmptyTitle() {
        for raw in ["(From \"Only\")", "(Original Motion Picture Soundtrack)", "[OST]", "   ", "- From \"X\""] {
            #expect(!SongTitle.parse(raw).title.isEmpty || raw.allSatisfy(\.isWhitespace), "empty for \(raw)")
        }
        #expect(SongTitle.parse("(From \"Only\")").title == "(From “Only”)" || SongTitle.parse("(From \"Only\")").title == "(From \"Only\")")
    }

    @Test func unbalancedBracketsAreLeftAlone() {
        #expect(SongTitle.parse("Odd (From \"X\"").title == "Odd (From “X”")
    }

    @Test func plainTitlesAreUntouched() {
        #expect(SongTitle.parse("Mellaga") == SongTitle(title: "Mellaga", context: nil))
        #expect(SongTitle.parse("மெல்லகா") == SongTitle(title: "மெல்லகா", context: nil))
        #expect(SongTitle.parse("तेरे बिना (From \"Guru\")") == SongTitle(title: "तेरे बिना", context: "Guru"))
    }

    @Test func parsingIsIdempotent() {
        let once = SongTitle.parse("Kesariya (From &quot;Brahmastra&quot;) - Original Motion Picture Soundtrack")
        #expect(SongTitle.parse(once.title).title == once.title)
    }
}

@Suite struct SongTitleRealWorldTests {
    @Test(arguments: [
        TitleCase(raw: "O Meri Mehbooba (From 'Dharam Veer')", title: "O Meri Mehbooba", context: "Dharam Veer"),
        TitleCase(raw: "Needhan En Kannadi (From ''Appa Kutti\")", title: "Needhan En Kannadi", context: "Appa Kutti"),
        TitleCase(raw: "Tujhko (From “Cocktail 2” / Sad Version)", title: "Tujhko (Sad Version)", context: "Cocktail 2"),
        TitleCase(raw: "Krishnakoli (From Album Mon Harano Gaan)", title: "Krishnakoli", context: "Mon Harano Gaan"),
        TitleCase(raw: "The Karma Theme (Telugu (From \"U Turn\"))", title: "The Karma Theme (Telugu)", context: "U Turn"),
        TitleCase(raw: "Adi Penne (Duet) (From Naam Series)", title: "Adi Penne (Duet)", context: "Naam Series"),
    ]) func messyMetadata(_ c: TitleCase) {
        let r = SongTitle.parse(c.raw)
        #expect(r.title == c.title)
        #expect(r.context == c.context)
    }
}
