import {
	INITIAL_STATE,
	type StoreGet,
	type StoreSet,
} from "@/lib/store/internal";
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
	| "setContentLanguage"
	| "toggleRadioMode"
> {
	return {
		setIsQueueOpen: (open) => {
			set({ isQueueOpen: open });
		},
		setSleepTimer: (minutes) => {
			set({ sleepTimerMinutes: minutes });
		},
		setContentLanguage: (language) => {
			set({ contentLanguage: language });
		},
		toggleRadioMode: () => {
			set((state) => ({ isRadioEnabled: !state.isRadioEnabled }));
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
			set({ ...INITIAL_STATE });
		},
	};
}
