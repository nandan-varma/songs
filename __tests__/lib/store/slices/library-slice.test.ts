import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLibrarySlice } from "@/lib/store/slices/library-slice";
import type { RepeatMode } from "@/lib/store/types";
import {
	type DetailedSong,
	EntityType,
	type EntityVisit,
	type LocalPlaylist,
} from "@/types/entity";

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

function makeState(
	overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
	return {
		currentSong: null as DetailedSong | null,
		isPlaying: false,
		currentTime: 0,
		duration: 0,
		volume: 0.7,
		playbackSpeed: 1,
		isMuted: false,
		queue: [] as DetailedSong[],
		queueIndex: 0,
		isShuffleEnabled: false,
		repeatMode: "off" as RepeatMode,
		favoriteIds: new Set<string>(),
		searchHistory: [] as string[],
		playbackHistory: [] as DetailedSong[],
		visitHistory: [] as EntityVisit[],
		maxHistorySize: 100,
		playlists: [] as LocalPlaylist[],
		isQueueOpen: false,
		downloadedSongIds: new Set<string>(),
		sleepTimerMinutes: null as number | null,
		...overrides,
	};
}

describe("library-slice", () => {
	let set: ReturnType<typeof vi.fn>;
	let get: ReturnType<typeof vi.fn>;
	let actions: ReturnType<typeof createLibrarySlice>;

	beforeEach(() => {
		set = vi.fn();
		get = vi.fn();
		actions = createLibrarySlice(set as never, get as never);
	});

	describe("toggleFavorite", () => {
		it("toggles favorite", () => {
			get.mockReturnValue(makeState({ favoriteIds: new Set() }));
			actions.toggleFavorite("song1");
			expect(set).toHaveBeenCalled();
		});
	});

	describe("isFavorite", () => {
		it("returns true when favorited", () => {
			get.mockReturnValue(makeState({ favoriteIds: new Set(["song1"]) }));
			expect(actions.isFavorite("song1")).toBe(true);
		});

		it("returns false when not favorited", () => {
			get.mockReturnValue(makeState({ favoriteIds: new Set() }));
			expect(actions.isFavorite("song1")).toBe(false);
		});
	});

	describe("addFavorite", () => {
		it("adds favorite", () => {
			actions.addFavorite("song1");
			expect(set).toHaveBeenCalled();
		});
	});

	describe("removeFavorite", () => {
		it("removes favorite", () => {
			actions.removeFavorite("song1");
			expect(set).toHaveBeenCalled();
		});
	});

	describe("addToSearchHistory", () => {
		it("adds query to search history", () => {
			get.mockReturnValue(makeState({ searchHistory: [], maxHistorySize: 10 }));
			actions.addToSearchHistory("test query");
			expect(set).toHaveBeenCalled();
		});

		it("does nothing for empty query", () => {
			get.mockReturnValue(makeState({ searchHistory: ["test"] }));
			actions.addToSearchHistory("   ");
			expect(set).not.toHaveBeenCalled();
		});
	});

	describe("clearSearchHistory", () => {
		it("clears search history", () => {
			actions.clearSearchHistory();
			expect(set).toHaveBeenCalledWith({ searchHistory: [] });
		});
	});

	describe("addToPlaybackHistory", () => {
		it("adds song to playback history", () => {
			const song = makeSong("1");
			get.mockReturnValue(
				makeState({ playbackHistory: [], maxHistorySize: 10 }),
			);
			actions.addToPlaybackHistory(song);
			expect(set).toHaveBeenCalled();
		});
	});

	describe("clearPlaybackHistory", () => {
		it("clears playback history", () => {
			actions.clearPlaybackHistory();
			expect(set).toHaveBeenCalledWith({ playbackHistory: [] });
		});
	});

	describe("addToVisitHistory", () => {
		it("adds visit to history", () => {
			const visit: EntityVisit = {
				entityId: "song1",
				entityType: EntityType.SONG,
				entityName: "Test Song",
				image: [],
				timestamp: Date.now(),
			};
			get.mockReturnValue(makeState({ visitHistory: [], maxHistorySize: 10 }));
			actions.addToVisitHistory(visit);
			expect(set).toHaveBeenCalled();
		});
	});

	describe("clearVisitHistory", () => {
		it("clears visit history", () => {
			actions.clearVisitHistory();
			expect(set).toHaveBeenCalledWith({ visitHistory: [] });
		});
	});
});
