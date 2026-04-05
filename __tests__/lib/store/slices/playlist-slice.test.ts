import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPlaylistSlice } from "@/lib/store/slices/playlist-slice";
import type { DetailedSong } from "@/types/entity";

function makeSong(id: string): DetailedSong {
	return {
		id,
		name: `Song ${id}`,
		type: "song",
		year: "2024",
		releaseDate: "2024-01-01",
		duration: 180,
		label: "Test",
		explicitContent: false,
		playCount: 100,
		language: "hindi",
		hasLyrics: false,
		lyricsId: null,
		url: `https://example.com/${id}`,
		copyright: "2024",
		album: { id: "album1", name: "Album", url: "https://example.com/album" },
		artists: { primary: [], featured: [], all: [] },
		image: [],
		downloadUrl: [],
	} as unknown as DetailedSong;
}

describe("playlist-slice", () => {
	let set: ReturnType<typeof vi.fn>;
	let actions: ReturnType<typeof createPlaylistSlice>;

	beforeEach(() => {
		set = vi.fn();
		actions = createPlaylistSlice(set as never);
	});

	describe("createPlaylist", () => {
		it("creates playlist with valid name", () => {
			const result = actions.createPlaylist("My Playlist");
			expect(result).toContain("playlist_");
			expect(set).toHaveBeenCalled();
		});

		it("throws error for empty name", () => {
			expect(() => actions.createPlaylist("")).toThrow(
				"Playlist name is required",
			);
		});

		it("throws error for whitespace-only name", () => {
			expect(() => actions.createPlaylist("   ")).toThrow(
				"Playlist name is required",
			);
		});
	});

	describe("updatePlaylist", () => {
		it("updates playlist name", () => {
			expect(() =>
				actions.updatePlaylist("playlist1", "New Name"),
			).not.toThrow();
		});

		it("throws error for empty name", () => {
			expect(() => actions.updatePlaylist("playlist1", "")).toThrow(
				"Playlist name is required",
			);
		});
	});

	describe("deletePlaylist", () => {
		it("removes playlist", () => {
			actions.deletePlaylist("playlist1");
			expect(set).toHaveBeenCalled();
		});
	});

	describe("addSongToPlaylist", () => {
		it("adds song to playlist", () => {
			const song = makeSong("1");
			actions.addSongToPlaylist("playlist1", song);
			expect(set).toHaveBeenCalled();
		});
	});

	describe("removeSongFromPlaylist", () => {
		it("removes song from playlist", () => {
			actions.removeSongFromPlaylist("playlist1", "song1");
			expect(set).toHaveBeenCalled();
		});
	});

	describe("reorderPlaylistSongs", () => {
		it("reorders songs", () => {
			actions.reorderPlaylistSongs("playlist1", 0, 2);
			expect(set).toHaveBeenCalled();
		});

		it("handles invalid indices", () => {
			actions.reorderPlaylistSongs("playlist1", -1, 5);
			expect(set).toHaveBeenCalled();
		});
	});
});
