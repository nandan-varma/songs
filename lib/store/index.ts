"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { APP_STORE_STORAGE_KEY } from "@/lib/store/constants";
import { INITIAL_STATE } from "@/lib/store/internal";
import { createDownloadsAndUiSlice } from "@/lib/store/slices/downloads-slice";
import { createLibrarySlice } from "@/lib/store/slices/library-slice";
import { createPlaybackSlice } from "@/lib/store/slices/playback-slice";
import { createPlaylistSlice } from "@/lib/store/slices/playlist-slice";
import type { AppStore, PersistedAppStoreState } from "./types";

export { APP_STORE_STORAGE_KEY, INITIAL_STATE };

export const useAppStore = create<AppStore>()(
	persist(
		(set, get) => ({
			...INITIAL_STATE,
			...createPlaybackSlice(set as never, get),
			...createLibrarySlice(set as never, get),
			...createPlaylistSlice(set as never),
			...createDownloadsAndUiSlice(set as never, get),
		}),
		{
			name: APP_STORE_STORAGE_KEY,
			storage: createJSONStorage(() => localStorage),
			version: 1,
			partialize: (state): PersistedAppStoreState => ({
				favoriteIds: Array.from(state.favoriteIds),
				searchHistory: state.searchHistory,
				playbackHistory: state.playbackHistory,
				visitHistory: state.visitHistory,
				playlists: state.playlists,
				volume: state.volume,
				playbackSpeed: state.playbackSpeed,
				downloadedSongIds: Array.from(state.downloadedSongIds),
				sleepTimerMinutes: state.sleepTimerMinutes,
			}),
			merge: (persistedState, currentState) => {
				if (!persistedState || typeof persistedState !== "object") {
					return currentState;
				}

				const persisted = persistedState as PersistedAppStoreState;
				return {
					...currentState,
					...persisted,
					favoriteIds: new Set(persisted.favoriteIds ?? []),
					downloadedSongIds: new Set(persisted.downloadedSongIds ?? []),
				};
			},
		},
	),
);
