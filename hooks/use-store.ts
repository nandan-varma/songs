"use client";

import { useAppStore } from "@/lib/store";
import * as selectors from "@/lib/store/selectors";

/**
 * Individual player property hooks - each manages its own subscription
 */
export const useCurrentSong = () => useAppStore(selectors.selectCurrentSong);
export const useIsPlaying = () => useAppStore(selectors.selectIsPlaying);
export const useCurrentTime = () => useAppStore(selectors.selectCurrentTime);
export const useDuration = () => useAppStore(selectors.selectDuration);
export const useVolume = () => useAppStore(selectors.selectVolume);
export const usePlaybackSpeed = () =>
	useAppStore(selectors.selectPlaybackSpeed);

/**
 * Player state hook - use this for convenience when you need all player state
 * WARNING: This returns a new object on each render, so prefer individual hooks above
 */
export function usePlayer() {
	const currentSong = useAppStore(selectors.selectCurrentSong);
	const isPlaying = useAppStore(selectors.selectIsPlaying);
	const currentTime = useAppStore(selectors.selectCurrentTime);
	const duration = useAppStore(selectors.selectDuration);
	const volume = useAppStore(selectors.selectVolume);
	const playbackSpeed = useAppStore(selectors.selectPlaybackSpeed);

	return {
		currentSong,
		isPlaying,
		currentTime,
		duration,
		volume,
		playbackSpeed,
	};
}

/**
 * Player actions hook
 */
export function usePlayerActions() {
	return useAppStore((state) => ({
		playSong: state.playSong,
		playQueue: state.playQueue,
		togglePlayPause: state.togglePlayPause,
		playNext: state.playNext,
		playPrevious: state.playPrevious,
		setSongTime: state.setSongTime,
		setSongDuration: state.setSongDuration,
		setVolume: state.setVolume,
		setPlaybackSpeed: state.setPlaybackSpeed,
		setCurrentSong: state.setCurrentSong,
		setIsPlaying: state.setIsPlaying,
	}));
}

/**
 * Individual queue property hooks
 */
export const useQueue_List = () => useAppStore(selectors.selectQueue);
export const useQueueIndex = () => useAppStore(selectors.selectQueueIndex);
export const useIsShuffleEnabled = () =>
	useAppStore(selectors.selectIsShuffleEnabled);
export const useRepeatMode = () => useAppStore(selectors.selectRepeatMode);

/**
 * Queue state hook
 */
export function useQueue() {
	const queue = useAppStore(selectors.selectQueue);
	const queueIndex = useAppStore(selectors.selectQueueIndex);
	const isShuffleEnabled = useAppStore(selectors.selectIsShuffleEnabled);
	const repeatMode = useAppStore(selectors.selectRepeatMode);

	return {
		queue,
		queueIndex,
		isShuffleEnabled,
		repeatMode,
	};
}

/**
 * Queue actions hook
 */
export function useQueueActions() {
	return useAppStore((state) => ({
		addSongToQueue: state.addSongToQueue,
		addSongsToQueue: state.addSongsToQueue,
		removeSongFromQueue: state.removeSongFromQueue,
		clearQueue: state.clearQueue,
		setQueueIndex: state.setQueueIndex,
		toggleShuffle: state.toggleShuffle,
		setRepeatMode: state.setRepeatMode,
		reorderQueue: state.reorderQueue,
	}));
}

/**
 * Favorites hook
 */
export function useFavorites() {
	const favoriteIds = useAppStore((state) => state.favoriteIds);
	const toggleFavorite = useAppStore((state) => state.toggleFavorite);
	const addFavorite = useAppStore((state) => state.addFavorite);
	const removeFavorite = useAppStore((state) => state.removeFavorite);
	const isFavorite = useAppStore((state) => state.isFavorite);

	return {
		favoriteIds,
		toggleFavorite,
		addFavorite,
		removeFavorite,
		isFavorite,
	};
}

/**
 * Check if a song is favorited
 */
export function useIsFavorite(songId: string) {
	return useAppStore((state) => state.isFavorite(songId));
}

/**
 * History hook
 */
export function useHistory() {
	const searchHistory = useAppStore(selectors.selectSearchHistory);
	const playbackHistory = useAppStore(selectors.selectPlaybackHistory);
	const addToSearchHistory = useAppStore((state) => state.addToSearchHistory);
	const clearSearchHistory = useAppStore((state) => state.clearSearchHistory);
	const addToPlaybackHistory = useAppStore(
		(state) => state.addToPlaybackHistory,
	);
	const clearPlaybackHistory = useAppStore(
		(state) => state.clearPlaybackHistory,
	);

	return {
		searchHistory,
		playbackHistory,
		addToSearchHistory,
		clearSearchHistory,
		addToPlaybackHistory,
		clearPlaybackHistory,
	};
}

/**
 * Playlists hook
 */
export function usePlaylists() {
	const playlists = useAppStore(selectors.selectPlaylists);
	const selectedPlaylistId = useAppStore(selectors.selectSelectedPlaylistId);
	const createPlaylist = useAppStore((state) => state.createPlaylist);
	const updatePlaylist = useAppStore((state) => state.updatePlaylist);
	const deletePlaylist = useAppStore((state) => state.deletePlaylist);
	const addSongToPlaylist = useAppStore((state) => state.addSongToPlaylist);
	const removeSongFromPlaylist = useAppStore(
		(state) => state.removeSongFromPlaylist,
	);
	const setSelectedPlaylist = useAppStore((state) => state.setSelectedPlaylist);

	return {
		playlists,
		selectedPlaylistId,
		createPlaylist,
		updatePlaylist,
		deletePlaylist,
		addSongToPlaylist,
		removeSongFromPlaylist,
		setSelectedPlaylist,
	};
}

/**
 * UI state hook
 */
export function useUIState() {
	const isMobile = useAppStore(selectors.selectIsMobile);
	const isDarkMode = useAppStore(selectors.selectIsDarkMode);
	const isQueueOpen = useAppStore(selectors.selectIsQueueOpen);
	const isOfflineMode = useAppStore(selectors.selectIsOfflineMode);
	const sleepTimerMinutes = useAppStore(selectors.selectSleepTimerMinutes);

	return {
		isMobile,
		isDarkMode,
		isQueueOpen,
		isOfflineMode,
		sleepTimerMinutes,
	};
}

/**
 * UI actions hook
 */
export function useUIActions() {
	const setIsMobile = useAppStore((state) => state.setIsMobile);
	const setIsDarkMode = useAppStore((state) => state.setIsDarkMode);
	const setIsQueueOpen = useAppStore((state) => state.setIsQueueOpen);
	const setIsOfflineMode = useAppStore((state) => state.setIsOfflineMode);
	const setSleepTimer = useAppStore((state) => state.setSleepTimer);

	return {
		setIsMobile,
		setIsDarkMode,
		setIsQueueOpen,
		setIsOfflineMode,
		setSleepTimer,
	};
}

/**
 * Offline hook
 */
export function useOffline() {
	const downloadedSongIds = useAppStore(selectors.selectDownloadedSongIds);
	const addDownloadedSong = useAppStore((state) => state.addDownloadedSong);
	const removeDownloadedSong = useAppStore(
		(state) => state.removeDownloadedSong,
	);
	const isDownloaded = useAppStore((state) => state.isDownloaded);

	return {
		downloadedSongIds,
		addDownloadedSong,
		removeDownloadedSong,
		isDownloaded,
	};
}

/**
 * Check if a song is downloaded
 */
export function useIsDownloaded(songId: string) {
	return useAppStore((state) => state.isDownloaded(songId));
}

/**
 * Offline mode state hook
 */
export const useIsOfflineMode = () =>
	useAppStore(selectors.selectIsOfflineMode);
