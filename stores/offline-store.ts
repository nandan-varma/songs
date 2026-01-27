import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { DetailedSong, Song } from "@/types/entity";

interface OfflineStore {
	isOfflineMode: boolean;
	cachedSongsCount: number;
	setOfflineMode: (enabled: boolean) => void;
	getFilteredSongs: <T extends Song | DetailedSong>(songs: T[]) => T[];
	getCachedSongsOnly: () => DetailedSong[];
	isOnlineContentAvailable: <T extends Song | DetailedSong>(
		songs: T[],
	) => boolean;
	shouldEnableQuery: () => boolean;
}

export const useOfflineStore = create<OfflineStore>()(
	subscribeWithSelector((_set, get) => ({
		isOfflineMode: !navigator.onLine,
		cachedSongsCount: 0,

		setOfflineMode: (enabled: boolean) => {
			// For now, offline mode is purely based on network status
			// This method is kept for API compatibility but does nothing
			console.log("Offline mode toggle requested:", enabled);
		},

		getFilteredSongs: <T extends Song | DetailedSong>(songs: T[]) => {
			const { isOfflineMode } = get();
			if (!isOfflineMode) return songs;
			// TODO: Filter based on cached songs
			return songs;
		},

		getCachedSongsOnly: () => {
			// TODO: Return actual cached songs
			return [];
		},

		isOnlineContentAvailable: <T extends Song | DetailedSong>(_songs: T[]) => {
			const { isOfflineMode } = get();
			if (!isOfflineMode) return true;
			// TODO: Check if any songs are cached
			return false;
		},

		shouldEnableQuery: () => {
			const { isOfflineMode } = get();
			return !isOfflineMode;
		},
	})),
);

// Selector hooks
export const useOffline = () =>
	useOfflineStore((state) => ({
		isOfflineMode: state.isOfflineMode,
		cachedSongsCount: state.cachedSongsCount,
		setOfflineMode: state.setOfflineMode,
		getFilteredSongs: state.getFilteredSongs,
		getCachedSongsOnly: state.getCachedSongsOnly,
		isOnlineContentAvailable: state.isOnlineContentAvailable,
		shouldEnableQuery: state.shouldEnableQuery,
	}));
