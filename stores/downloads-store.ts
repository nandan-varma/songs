import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { CachedSong } from "@/hooks/data/use-cache-manager";
import type { DetailedSong } from "@/types/entity";

interface DownloadsStore {
	cachedSongs: Map<string, CachedSong>;
	isDownloading: boolean;
	downloadSong: (song: DetailedSong) => Promise<void>;
	removeSong: (songId: string) => void;
	getSongBlob: (songId: string) => Promise<Blob | null>;
	isSongCached: (songId: string) => boolean;
	saveToDevice: () => Promise<void>;
}

// Note: This store is a placeholder. The actual implementation would integrate
// with the existing useCacheManager, useDownloadOperations, and useDeviceStorage hooks.
// For the migration, we'll create a basic structure that can be filled in later.

export const useDownloadsStore = create<DownloadsStore>()(
	subscribeWithSelector((set, get) => ({
		cachedSongs: new Map<string, CachedSong>(),
		isDownloading: false,

		downloadSong: async (song: DetailedSong) => {
			// TODO: Integrate with useDownloadOperations
			console.log("Downloading song:", song.name);
		},

		removeSong: (songId: string) => {
			// TODO: Integrate with cache manager
			console.log("Removing song:", songId);
			set((state) => {
				const newCachedSongs = new Map(state.cachedSongs);
				newCachedSongs.delete(songId);
				return { cachedSongs: newCachedSongs };
			});
		},

		getSongBlob: async (songId: string) => {
			// TODO: Integrate with cache manager
			console.log("Getting blob for:", songId);
			return null;
		},

		isSongCached: (songId: string) => {
			const { cachedSongs } = get();
			return cachedSongs.has(songId);
		},

		saveToDevice: async () => {
			// TODO: Integrate with useDeviceStorage
			console.log("Saving to device");
		},
	})),
);

// Selector hooks
export const useDownloadsState = () =>
	useDownloadsStore((state) => ({
		cachedSongs: state.cachedSongs,
		isDownloading: state.isDownloading,
	}));

export const useDownloadsActions = () =>
	useDownloadsStore((state) => ({
		downloadSong: state.downloadSong,
		removeSong: state.removeSong,
		getSongBlob: state.getSongBlob,
		isSongCached: state.isSongCached,
		saveToDevice: state.saveToDevice,
	}));

export const useDownloads = () => {
	const state = useDownloadsState();
	const actions = useDownloadsActions();
	return {
		...state,
		...actions,
	};
};
