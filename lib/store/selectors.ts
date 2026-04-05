import type { AppStoreState } from "./types";

export const selectCurrentSong = (state: AppStoreState) => state.currentSong;
export const selectIsPlaying = (state: AppStoreState) => state.isPlaying;
export const selectCurrentTime = (state: AppStoreState) => state.currentTime;
export const selectDuration = (state: AppStoreState) => state.duration;
export const selectVolume = (state: AppStoreState) => state.volume;
export const selectPlaybackSpeed = (state: AppStoreState) =>
	state.playbackSpeed;
export const selectIsMuted = (state: AppStoreState) => state.isMuted;
export const selectQueue = (state: AppStoreState) => state.queue;
export const selectQueueIndex = (state: AppStoreState) => state.queueIndex;
export const selectIsShuffleEnabled = (state: AppStoreState) =>
	state.isShuffleEnabled;
export const selectRepeatMode = (state: AppStoreState) => state.repeatMode;
export const selectQueueLength = (state: AppStoreState) => state.queue.length;
export const selectFavoriteIds = (state: AppStoreState) => state.favoriteIds;
export const selectIsFavorite = (songId: string) => (state: AppStoreState) =>
	state.favoriteIds.has(songId);
export const selectSearchHistory = (state: AppStoreState) =>
	state.searchHistory;
export const selectPlaybackHistory = (state: AppStoreState) =>
	state.playbackHistory;
export const selectVisitHistory = (state: AppStoreState) => state.visitHistory;
export const selectPlaylists = (state: AppStoreState) => state.playlists;
export const selectIsQueueOpen = (state: AppStoreState) => state.isQueueOpen;
export const selectSleepTimerMinutes = (state: AppStoreState) =>
	state.sleepTimerMinutes;
export const selectDownloadedSongIds = (state: AppStoreState) =>
	state.downloadedSongIds;
export const selectIsDownloaded = (songId: string) => (state: AppStoreState) =>
	state.downloadedSongIds.has(songId);
