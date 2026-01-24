import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { DetailedSong, Song } from "@/types/entity";
import { useDownloadsStore } from "./downloads-store";

interface OfflineStore {
	// State (derived from network detection)
	isOnline: boolean;

	// Derived getters
	isOfflineMode: () => boolean;
	cachedSongsCount: () => number;

	// Actions
	setIsOnline: (online: boolean) => void;
	getFilteredSongs: <T extends Song | DetailedSong>(songs: T[]) => T[];
	getCachedSongsOnly: () => DetailedSong[];
	isOnlineContentAvailable: <T extends Song | DetailedSong>(
		songs: T[],
	) => boolean;
	shouldEnableQuery: () => boolean;
}

export const useOfflineStore = create<OfflineStore>()(
	devtools(
		(set, get) => ({
			isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,

			isOfflineMode: () => !get().isOnline,

			cachedSongsCount: () => {
				const cachedSongs = useDownloadsStore.getState().cachedSongs;
				return cachedSongs.size;
			},

			setIsOnline: (online) => set({ isOnline: online }),

			getFilteredSongs: <T extends Song | DetailedSong>(songs: T[]): T[] => {
				const isOfflineMode = get().isOfflineMode();
				if (!isOfflineMode) return songs;

				const isSongCached = useDownloadsStore.getState().isSongCached;
				return songs.filter((song) => isSongCached(song.id));
			},

			getCachedSongsOnly: () => {
				const cachedSongs = useDownloadsStore.getState().cachedSongs;
				return Array.from(cachedSongs.values()).map((item) => item.song);
			},

			isOnlineContentAvailable: <T extends Song | DetailedSong>(
				songs: T[],
			): boolean => {
				const isOfflineMode = get().isOfflineMode();
				if (!isOfflineMode) return true;

				const isSongCached = useDownloadsStore.getState().isSongCached;
				return songs.some((song) => isSongCached(song.id));
			},

			shouldEnableQuery: () => !get().isOfflineMode(),
		}),
		{ name: "offline-store" },
	),
);

// Hook to connect network detection
export function useNetworkSync() {
	const setIsOnline = useOfflineStore((state) => state.setIsOnline);

	if (typeof window !== "undefined") {
		window.addEventListener("online", () => setIsOnline(true));
		window.addEventListener("offline", () => setIsOnline(false));
	}
}
