import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDownloadsAndUiSlice } from "@/lib/store/slices/downloads-slice";
import type { RepeatMode } from "@/lib/store/types";
import type { DetailedSong, LocalPlaylist } from "@/types/entity";

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

describe("downloads-slice", () => {
	let set: ReturnType<typeof vi.fn>;
	let get: ReturnType<typeof vi.fn>;
	let actions: ReturnType<typeof createDownloadsAndUiSlice>;

	beforeEach(() => {
		set = vi.fn();
		get = vi.fn();
		actions = createDownloadsAndUiSlice(set as never, get as never);
	});

	describe("setIsQueueOpen", () => {
		it("sets isQueueOpen to true", () => {
			actions.setIsQueueOpen(true);
			expect(set).toHaveBeenCalledWith({ isQueueOpen: true });
		});
	});

	describe("setSleepTimer", () => {
		it("sets sleep timer minutes", () => {
			actions.setSleepTimer(30);
			expect(set).toHaveBeenCalledWith({ sleepTimerMinutes: 30 });
		});

		it("can clear sleep timer", () => {
			actions.setSleepTimer(null);
			expect(set).toHaveBeenCalledWith({ sleepTimerMinutes: null });
		});
	});

	describe("addDownloadedSong", () => {
		it("adds song to downloaded set", () => {
			actions.addDownloadedSong("song1");
			expect(set).toHaveBeenCalled();
		});
	});

	describe("removeDownloadedSong", () => {
		it("removes song from downloaded set", () => {
			actions.removeDownloadedSong("song1");
			expect(set).toHaveBeenCalled();
		});
	});

	describe("syncDownloadedSongs", () => {
		it("replaces downloaded song ids", () => {
			actions.syncDownloadedSongs(["song1", "song2"]);
			expect(set).toHaveBeenCalled();
		});
	});

	describe("clearDownloadedSongs", () => {
		it("clears all downloaded songs", () => {
			actions.clearDownloadedSongs();
			expect(set).toHaveBeenCalled();
		});
	});

	describe("isDownloaded", () => {
		it("returns true for downloaded song", () => {
			get.mockReturnValue(makeState({ downloadedSongIds: new Set(["song1"]) }));
			expect(actions.isDownloaded("song1")).toBe(true);
		});

		it("returns false for non-downloaded song", () => {
			get.mockReturnValue(makeState({ downloadedSongIds: new Set() }));
			expect(actions.isDownloaded("song1")).toBe(false);
		});
	});

	describe("resetStore", () => {
		it("resets to initial state", () => {
			actions.resetStore();
			expect(set).toHaveBeenCalled();
		});
	});
});
