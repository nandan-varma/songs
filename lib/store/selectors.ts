/**
 * Store selectors for optimized component subscriptions
 * @module lib/store/selectors
 */

import type { AppStoreState } from "./types";

// ============ PLAYER SELECTORS ============
export const selectCurrentSong = (state: AppStoreState) => state.currentSong;
export const selectIsPlaying = (state: AppStoreState) => state.isPlaying;
export const selectCurrentTime = (state: AppStoreState) => state.currentTime;
export const selectDuration = (state: AppStoreState) => state.duration;
export const selectVolume = (state: AppStoreState) => state.volume;
export const selectPlaybackSpeed = (state: AppStoreState) =>
	state.playbackSpeed;

export const selectPlayerState = (state: AppStoreState) => ({
	currentSong: state.currentSong,
	isPlaying: state.isPlaying,
	currentTime: state.currentTime,
	duration: state.duration,
	volume: state.volume,
	playbackSpeed: state.playbackSpeed,
});

// ============ QUEUE SELECTORS ============
export const selectQueue = (state: AppStoreState) => state.queue;
export const selectQueueIndex = (state: AppStoreState) => state.queueIndex;
export const selectIsShuffleEnabled = (state: AppStoreState) =>
	state.isShuffleEnabled;
export const selectRepeatMode = (state: AppStoreState) => state.repeatMode;
export const selectQueueLength = (state: AppStoreState) => state.queue.length;

export const selectQueueState = (state: AppStoreState) => ({
	queue: state.queue,
	queueIndex: state.queueIndex,
	isShuffleEnabled: state.isShuffleEnabled,
	repeatMode: state.repeatMode,
});

// ============ FAVORITES SELECTORS ============
export const selectFavoriteIds = (state: AppStoreState) => state.favoriteIds;
export const selectIsFavorite = (songId: string) => (state: AppStoreState) =>
	state.favoriteIds.has(songId);

// ============ HISTORY SELECTORS ============
export const selectSearchHistory = (state: AppStoreState) =>
	state.searchHistory;
export const selectPlaybackHistory = (state: AppStoreState) =>
	state.playbackHistory;

// ============ PLAYLISTS SELECTORS ============
export const selectPlaylists = (state: AppStoreState) => state.playlists;
export const selectSelectedPlaylistId = (state: AppStoreState) =>
	state.selectedPlaylistId;
export const selectSelectedPlaylist = (state: AppStoreState) =>
	state.selectedPlaylistId
		? state.playlists.find((p) => p.id === state.selectedPlaylistId)
		: null;

// ============ UI SELECTORS ============
export const selectIsMobile = (state: AppStoreState) => state.isMobile;
export const selectIsDarkMode = (state: AppStoreState) => state.isDarkMode;
export const selectIsQueueOpen = (state: AppStoreState) => state.isQueueOpen;
export const selectIsOfflineMode = (state: AppStoreState) =>
	state.isOfflineMode;
export const selectSleepTimerMinutes = (state: AppStoreState) =>
	state.sleepTimerMinutes;

// ============ OFFLINE SELECTORS ============
export const selectDownloadedSongIds = (state: AppStoreState) =>
	state.downloadedSongIds;
export const selectIsDownloaded = (songId: string) => (state: AppStoreState) =>
	state.downloadedSongIds.has(songId);
