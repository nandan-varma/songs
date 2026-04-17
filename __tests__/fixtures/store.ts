import { vi } from "vitest";
import type { AppStoreState, RepeatMode } from "@/lib/store/types";
import type { DetailedSong, EntityVisit, LocalPlaylist } from "@/types/entity";

type PartialState = Partial<AppStoreState>;

function createMockState(overrides: PartialState = {}): AppStoreState {
	return {
		currentSong: null,
		isPlaying: false,
		currentTime: 0,
		duration: 0,
		volume: 0.7,
		playbackSpeed: 1,
		isMuted: false,
		queue: [],
		queueIndex: 0,
		isShuffleEnabled: false,
		repeatMode: "off" as RepeatMode,
		favoriteIds: new Set<string>(),
		searchHistory: [],
		playbackHistory: [],
		visitHistory: [],
		maxHistorySize: 100,
		playlists: [],
		isQueueOpen: false,
		downloadedSongIds: new Set<string>(),
		sleepTimerMinutes: null,
		...overrides,
	};
}

export interface MockStoreOptions {
	initialState?: PartialState;
	songs?: DetailedSong[];
	queue?: DetailedSong[];
	favoriteIds?: string[];
	searchHistory?: string[];
	playbackHistory?: DetailedSong[];
	visitHistory?: EntityVisit[];
	playlists?: LocalPlaylist[];
	downloadedSongIds?: string[];
}

export function createMockStore(options: MockStoreOptions = {}) {
	const {
		initialState,
		queue = [],
		favoriteIds = [],
		searchHistory = [],
		playbackHistory = [],
		visitHistory = [],
		playlists = [],
		downloadedSongIds = [],
	} = options;

	const state = createMockState({
		...initialState,
		queue,
		favoriteIds: new Set(favoriteIds),
		searchHistory,
		playbackHistory,
		visitHistory,
		playlists,
		downloadedSongIds: new Set(downloadedSongIds),
	});

	const mockGet = vi.fn(() => state);
	const mockSet = vi.fn(
		(
			updater:
				| Partial<AppStoreState>
				| ((prev: AppStoreState) => Partial<AppStoreState>),
		) => {
			if (typeof updater === "function") {
				const updates = updater(state);
				Object.assign(state, updates);
			} else {
				Object.assign(state, updater);
			}
		},
	);

	return {
		get: mockGet,
		set: mockSet,
		state,
	};
}

export type MockStore = ReturnType<typeof createMockStore>;

export function createMockSetGetter() {
	const set = vi.fn();
	const get = vi.fn();
	return {
		set: set as AppStoreState extends Record<string, unknown>
			? (
					state:
						| Partial<AppStoreState>
						| ((prev: AppStoreState) => Partial<AppStoreState>),
				) => void
			: never,
		get,
	};
}

export { createMockState, vi };
