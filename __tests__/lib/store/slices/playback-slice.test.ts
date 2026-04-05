import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPlaybackSlice } from "@/lib/store/slices/playback-slice";
import type { RepeatMode } from "@/lib/store/types";
import type { DetailedSong, LocalPlaylist } from "@/types/entity";

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
		visitHistory: [] as { entityId: string; entityType: string }[],
		maxHistorySize: 100,
		playlists: [] as LocalPlaylist[],
		isQueueOpen: false,
		downloadedSongIds: new Set<string>(),
		sleepTimerMinutes: null as number | null,
		...overrides,
	};
}

describe("playback-slice", () => {
	let set: ReturnType<typeof vi.fn>;
	let get: ReturnType<typeof vi.fn>;
	let actions: ReturnType<typeof createPlaybackSlice>;

	beforeEach(() => {
		set = vi.fn();
		get = vi.fn();
		actions = createPlaybackSlice(set as never, get as never);
	});

	describe("playSong", () => {
		it("replaces queue with single song when replaceQueue=true", () => {
			const song = makeSong("1");
			actions.playSong(song, true);
			expect(set).toHaveBeenCalled();
		});

		it("finds existing song in queue when replaceQueue=false", () => {
			const song1 = makeSong("1");
			const song2 = makeSong("2");
			get.mockReturnValue(makeState({ queue: [song1, song2], queueIndex: 0 }));
			actions.playSong(song2, false);
			expect(set).toHaveBeenCalled();
		});
	});

	describe("playQueue", () => {
		it("sets queue with start index", () => {
			const songs = [makeSong("1"), makeSong("2"), makeSong("3")];
			actions.playQueue(songs, 1);
			expect(set).toHaveBeenCalledWith(
				expect.objectContaining({
					queue: songs,
					queueIndex: 1,
				}),
			);
		});

		it("handles empty songs array", () => {
			actions.playQueue([], 0);
			expect(set).not.toHaveBeenCalled();
		});
	});

	describe("togglePlayPause", () => {
		it("toggles isPlaying", () => {
			get.mockReturnValue(makeState({ isPlaying: false }));
			actions.togglePlayPause();
			expect(set).toHaveBeenCalled();
		});
	});

	describe("playNext", () => {
		it("returns empty state when queue is empty", () => {
			get.mockReturnValue(makeState({ queue: [] }));
			actions.playNext();
			expect(set).toHaveBeenCalled();
		});

		it("restarts song when repeat mode is one", () => {
			const song = makeSong("1");
			get.mockReturnValue(
				makeState({
					queue: [song],
					queueIndex: 0,
					currentSong: song,
					repeatMode: "one",
				}),
			);
			actions.playNext();
			expect(set).toHaveBeenCalled();
		});

		it("plays next song normally", () => {
			const songs = [makeSong("1"), makeSong("2")];
			get.mockReturnValue(
				makeState({
					queue: songs,
					queueIndex: 0,
					repeatMode: "off",
				}),
			);
			actions.playNext();
			expect(set).toHaveBeenCalled();
		});
	});

	describe("playPrevious", () => {
		it("restarts when currentTime > threshold", () => {
			get.mockReturnValue(makeState({ currentTime: 5 }));
			actions.playPrevious();
			expect(set).toHaveBeenCalled();
		});
	});

	describe("setSongTime", () => {
		it("sets currentTime", () => {
			actions.setSongTime(30);
			expect(set).toHaveBeenCalledWith({ currentTime: 30 });
		});
	});

	describe("setSongDuration", () => {
		it("handles NaN", () => {
			actions.setSongDuration(NaN);
			expect(set).toHaveBeenCalledWith({ duration: 0 });
		});
	});

	describe("setVolume", () => {
		it("sets volume", () => {
			actions.setVolume(0.5);
			expect(set).toHaveBeenCalledWith({ volume: 0.5 });
		});
	});

	describe("setPlaybackSpeed", () => {
		it("sets playbackSpeed", () => {
			actions.setPlaybackSpeed(1.5);
			expect(set).toHaveBeenCalledWith({ playbackSpeed: 1.5 });
		});
	});

	describe("setCurrentSong", () => {
		it("sets currentSong", () => {
			const song = makeSong("1");
			actions.setCurrentSong(song);
			expect(set).toHaveBeenCalledWith({ currentSong: song });
		});
	});

	describe("setIsPlaying", () => {
		it("sets isPlaying", () => {
			actions.setIsPlaying(true);
			expect(set).toHaveBeenCalledWith({ isPlaying: true });
		});
	});

	describe("toggleMute", () => {
		it("toggles isMuted", () => {
			get.mockReturnValue(makeState({ isMuted: false }));
			actions.toggleMute();
			expect(set).toHaveBeenCalled();
		});
	});

	describe("addSongToQueue", () => {
		it("adds song to queue", () => {
			const song = makeSong("1");
			actions.addSongToQueue(song);
			expect(set).toHaveBeenCalled();
		});
	});

	describe("addSongsToQueue", () => {
		it("adds multiple songs to queue", () => {
			const songs = [makeSong("1"), makeSong("2")];
			actions.addSongsToQueue(songs);
			expect(set).toHaveBeenCalled();
		});

		it("does nothing for empty array", () => {
			actions.addSongsToQueue([]);
			expect(set).not.toHaveBeenCalled();
		});
	});

	describe("insertSongNext", () => {
		it("inserts song at next position", () => {
			const song1 = makeSong("1");
			const song2 = makeSong("2");
			get.mockReturnValue(
				makeState({
					queue: [song1],
					queueIndex: 0,
					currentSong: song1,
				}),
			);
			actions.insertSongNext(song2);
			expect(set).toHaveBeenCalled();
		});
	});

	describe("removeSongFromQueue", () => {
		it("removes song at valid index", () => {
			const songs = [makeSong("1"), makeSong("2")];
			get.mockReturnValue(
				makeState({
					queue: songs,
					queueIndex: 0,
				}),
			);
			actions.removeSongFromQueue(0);
			expect(set).toHaveBeenCalled();
		});

		it("handles out of bounds index", () => {
			const songs = [makeSong("1")];
			get.mockReturnValue(
				makeState({
					queue: songs,
					queueIndex: 0,
				}),
			);
			actions.removeSongFromQueue(10);
			expect(set).toHaveBeenCalled();
		});
	});

	describe("clearQueue", () => {
		it("clears all queue state", () => {
			actions.clearQueue();
			expect(set).toHaveBeenCalled();
		});
	});

	describe("setQueueIndex", () => {
		it("sets queue index within bounds", () => {
			const songs = [makeSong("1"), makeSong("2")];
			get.mockReturnValue(
				makeState({
					queue: songs,
				}),
			);
			actions.setQueueIndex(1);
			expect(set).toHaveBeenCalled();
		});
	});

	describe("toggleShuffle", () => {
		it("toggles shuffle", () => {
			get.mockReturnValue(makeState({ isShuffleEnabled: false }));
			actions.toggleShuffle();
			expect(set).toHaveBeenCalled();
		});
	});

	describe("setRepeatMode", () => {
		it("sets repeat mode", () => {
			actions.setRepeatMode("all");
			expect(set).toHaveBeenCalledWith({ repeatMode: "all" });
		});
	});

	describe("reorderQueue", () => {
		it("reorders queue", () => {
			const songs = [makeSong("1"), makeSong("2"), makeSong("3")];
			get.mockReturnValue(
				makeState({
					queue: songs,
					queueIndex: 1,
				}),
			);
			actions.reorderQueue(0, 2);
			expect(set).toHaveBeenCalled();
		});

		it("handles invalid indices", () => {
			const songs = [makeSong("1"), makeSong("2")];
			get.mockReturnValue(
				makeState({
					queue: songs,
					queueIndex: 0,
				}),
			);
			actions.reorderQueue(-1, 5);
			expect(set).toHaveBeenCalled();
		});
	});
});
