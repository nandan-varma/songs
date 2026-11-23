import Testing
@testable import ModesCore

@Suite struct ArtistLineTests {
    @Test func joinsLikeAppleMusic() {
        #expect(ArtistLine.format([]) == "")
        #expect(ArtistLine.format(["A"]) == "A")
        #expect(ArtistLine.format(["A", "B"]) == "A & B")
        #expect(ArtistLine.format(["A", "B", "C"]) == "A, B & C")
        #expect(ArtistLine.format(["A", "B", "C", "D"]) == "A, B, C & D")
    }

    @Test func compactForNarrowRows() {
        #expect(ArtistLine.compact(["A"]) == "A")
        #expect(ArtistLine.compact(["A", "B"]) == "A & B")
        #expect(ArtistLine.compact(["A", "B", "C"]) == "A, B +1")
        #expect(ArtistLine.compact(["A", "B", "C", "D", "E"]) == "A, B +3")
        #expect(ArtistLine.compact(["A", "B", "C", "D"], visible: 3) == "A, B, C +1")
    }

    @Test func splitsRawCredits() {
        #expect(ArtistLine.names(from: "Devi Sri Prasad, S.P. Charan") == ["Devi Sri Prasad", "S.P. Charan"])
        #expect(ArtistLine.names(from: "Arijit Singh &amp; Shreya Ghoshal") == ["Arijit Singh", "Shreya Ghoshal"])
        #expect(ArtistLine.names(from: " A ,, B ; C ") == ["A", "B", "C"])
        #expect(ArtistLine.names(from: "A, a, B") == ["A", "B"])
        #expect(ArtistLine.names(from: "") == [])
    }

    @Test func displayReadsFromRawText() {
        #expect(ArtistLine.display("Anirudh Ravichander, Shruti Haasan, Hiphop Tamizha") == "Anirudh Ravichander, Shruti Haasan & Hiphop Tamizha")
        #expect(ArtistLine.compact("Anirudh Ravichander, Shruti Haasan, Hiphop Tamizha") == "Anirudh Ravichander, Shruti Haasan +1")
        #expect(ArtistLine.display("Kishore Kumar") == "Kishore Kumar")
    }
}

@Suite struct DisplayTextTests {
    @Test func decodesEntities() {
        #expect(DisplayText.clean("&quot;Hi&quot; &amp; &#039;bye&#039; &#x27;x&#x27; &lt;b&gt;") == "\"Hi\" & 'bye' 'x' <b>")
        #expect(DisplayText.clean("AT&T rocks") == "AT&T rocks")
        #expect(DisplayText.clean("&bogus; &#0; ok") == "&bogus; &#0; ok")
    }

    @Test func foldsWhitespaceButKeepsJoiners() {
        #expect(DisplayText.clean("  a \t b\u{00A0}\u{00A0}c\n") == "a b c")
        #expect(DisplayText.clean("क्\u{200D}ष") == "क्\u{200D}ष")
    }

    @Test func curlsQuotes() {
        #expect(DisplayText.typographic("\"Hi\"") == "“Hi”")
        #expect(DisplayText.typographic("don't") == "don’t")
        #expect(DisplayText.typographic("'Tis fine") == "‘Tis fine")
        #expect(DisplayText.typographic("the '90s") == "the ’90s")
        #expect(DisplayText.typographic("say (\"x\")") == "say (“x”)")
        #expect(DisplayText.typographic("plain") == "plain")
    }
}

@Suite struct SongDisplayTests {
    @Test func combinesTitleArtistAndContext() {
        let d = SongDisplay(title: "Naacho Naacho (From &quot;Rrr&quot;)", artist: "Rahul Sipligunj, Kaala Bhairava, M M Keeravaani", album: "Rrr")
        #expect(d.title == "Naacho Naacho")
        #expect(d.context == "Rrr")
        #expect(d.artist == "Rahul Sipligunj, Kaala Bhairava & M M Keeravaani")
        #expect(d.compactArtist == "Rahul Sipligunj, Kaala Bhairava +1")
        #expect(d.spoken == "Naacho Naacho, Rahul Sipligunj, Kaala Bhairava & M M Keeravaani")
    }
}
