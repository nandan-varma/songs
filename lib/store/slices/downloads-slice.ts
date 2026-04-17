import { type StoreGet, type StoreSet } from "@/lib/store/internal";
import type { AppStoreActions } from "@/lib/store/types";

export function createDownloadsAndUiSlice(
	set: StoreSet,
	get: StoreGet,
): Pick<
	AppStoreActions,
	| "setIsQueueOpen"
	| "setSleepTimer"
	| "addDownloadedSong"
	| "removeDownloadedSong"
	| "syncDownloadedSongs"
	| "clearDownloadedSongs"
	| "isDownloaded"
	| "resetStore"
> {
	return {
		setIsQueueOpen: (open) => {
			set({ isQueueOpen: open });
		},
		setSleepTimer: (minutes) => {
			set({ sleepTimerMinutes: minutes });
		},
		addDownloadedSong: (songId) => {
			set((state) => ({
				downloadedSongIds: new Set(state.downloadedSongIds).add(songId),
			}));
		},
		removeDownloadedSong: (songId) => {
			set((state) => {
				const downloadedSongIds = new Set(state.downloadedSongIds);
				downloadedSongIds.delete(songId);
				return { downloadedSongIds };
			});
		},
		syncDownloadedSongs: (songIds) => {
			set({ downloadedSongIds: new Set(songIds) });
		},
		clearDownloadedSongs: () => {
			set({ downloadedSongIds: new Set() });
		},
		isDownloaded: (songId) => get().downloadedSongIds.has(songId),
		resetStore: () => {
			set({
				isQueueOpen: false,
				sleepTimerMinutes: null,
				downloadedSongIds: new Set(),
			});
		},
	};
}
