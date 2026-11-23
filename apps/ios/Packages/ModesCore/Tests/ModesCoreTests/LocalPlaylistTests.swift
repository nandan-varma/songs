import Foundation
import Testing
@testable import ModesCore

struct LocalPlaylistTests {
    private func item(_ id: String, title: String = "Song") -> LibraryItem {
        LibraryItem(id: id, title: title, artist: "Artist")
    }

    @Test func addsWithoutDuplicatesAndRemoves() {
        var playlist = LocalPlaylist(name: "Mix")
        let firstAdd = playlist.add(item("c:1"))
        let duplicateAdd = playlist.add(item("c:1"))
        let secondAdd = playlist.add(item("c:2"))
        #expect(firstAdd)
        #expect(!duplicateAdd)
        #expect(secondAdd)
        #expect(playlist.songs.map(\.id) == ["c:1", "c:2"])
        let firstRemove = playlist.remove(songID: "c:1")
        let secondRemove = playlist.remove(songID: "c:1")
        #expect(firstRemove)
        #expect(!secondRemove)
        #expect(playlist.songs.map(\.id) == ["c:2"])
    }

    @Test func renameRejectsEmptyAndUnchanged() {
        var playlist = LocalPlaylist(name: "Mix")
        let renamed = playlist.rename("Drive")
        #expect(renamed)
        #expect(playlist.name == "Drive")
        let emptyRename = playlist.rename("   ")
        let unchangedRename = playlist.rename("Drive")
        #expect(!emptyRename)
        #expect(!unchangedRename)
    }

    @Test func playlistRoundTrips() throws {
        var playlist = LocalPlaylist(name: "Mix")
        playlist.add(item("c:1"))
        let data = try PropertyListEncoder().encode(playlist)
        let decoded = try PropertyListDecoder().decode(LocalPlaylist.self, from: data)
        #expect(decoded.songs.map(\.id) == ["c:1"])
    }
}
