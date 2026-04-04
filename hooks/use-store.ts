"use client";

/**
 * Store Hooks - Domain-Based Organization
 *
 * CRITICAL: Use these patterns to avoid infinite loops:
 * ✅ Use individual property hooks in render: const song = useCurrentSong()
 * ✅ Access actions in callbacks: const { playSong } = useAppStore.getState()
 * ❌ NEVER destructure actions in render
 * ❌ NEVER use object-returning hooks in dependency arrays
 */

import { useCallback } from "react";
import { useAppStore } from "@/lib/store";
import * as selectors from "@/lib/store/selectors";

// ============ RE-EXPORT MAIN STORE ============
export { useAppStore };

// ============ PLAYER HOOKS ============

/**
 * Individual player property hooks - safe for dependency arrays
 */
export const useCurrentSong = () => useAppStore(selectors.selectCurrentSong);
export const useIsPlaying = () => useAppStore(selectors.selectIsPlaying);
export const useCurrentTime = () => useAppStore(selectors.selectCurrentTime);
export const useDuration = () => useAppStore(selectors.selectDuration);
export const useVolume = () => useAppStore(selectors.selectVolume);
export const usePlaybackSpeed = () =>
	useAppStore(selectors.selectPlaybackSpeed);

/**
 * Player state hook - composed from individual selectors
 * Use when you need multiple player properties
 */
export function usePlayer() {
	const currentSong = useCurrentSong();
	const isPlaying = useIsPlaying();
	const currentTime = useCurrentTime();
	const duration = useDuration();
	const volume = useVolume();
	const playbackSpeed = usePlaybackSpeed();

	return {
		currentSong,
		isPlaying,
		currentTime,
		duration,
		volume,
		playbackSpeed,
	};
}

// ============ QUEUE HOOKS ============

/**
 * Individual queue property hooks - safe for dependency arrays
 */
export const useQueue_List = () => useAppStore(selectors.selectQueue);
export const useQueueIndex = () => useAppStore(selectors.selectQueueIndex);
export const useIsShuffleEnabled = () =>
	useAppStore(selectors.selectIsShuffleEnabled);
export const useRepeatMode = () => useAppStore(selectors.selectRepeatMode);
export const useQueueLength = () => useAppStore(selectors.selectQueueLength);

/**
 * Queue state hook - composed from individual selectors
 * Use when you need multiple queue properties
 */
export function useQueue() {
	const queue = useQueue_List();
	const queueIndex = useQueueIndex();
	const isShuffleEnabled = useIsShuffleEnabled();
	const repeatMode = useRepeatMode();

	return {
		queue,
		queueIndex,
		isShuffleEnabled,
		repeatMode,
	};
}

// ============ FAVORITES HOOKS ============

/**
 * Favorites state hook - returns multiple pieces of favorited state
 */
export function useFavorites() {
	const favoriteIds = useAppStore((state) => state.favoriteIds);
	const isFavorite = (songId: string) =>
		useAppStore.getState().isFavorite(songId);
	const toggleFavorite = (songId: string) =>
		useAppStore.getState().toggleFavorite(songId);
	const addFavorite = (songId: string) =>
		useAppStore.getState().addFavorite(songId);
	const removeFavorite = (songId: string) =>
		useAppStore.getState().removeFavorite(songId);

	return {
		favoriteIds,
		isFavorite,
		toggleFavorite,
		addFavorite,
		removeFavorite,
	};
}

/**
 * Check if a specific song is favorited
 */
export function useIsFavorite(songId: string) {
	return useAppStore((state) => state.isFavorite(songId));
}

// ============ HISTORY HOOKS ============

/**
 * History state hook
 */
export function useHistory() {
	const searchHistory = useAppStore(selectors.selectSearchHistory);
	const playbackHistory = useAppStore(selectors.selectPlaybackHistory);

	const addToSearchHistory = (query: string) =>
		useAppStore.getState().addToSearchHistory(query);
	const clearSearchHistory = () => useAppStore.getState().clearSearchHistory();
	const addToPlaybackHistory = (song: import("@/types/entity").DetailedSong) =>
		useAppStore.getState().addToPlaybackHistory(song);
	const clearPlaybackHistory = () =>
		useAppStore.getState().clearPlaybackHistory();

	return {
		searchHistory,
		playbackHistory,
		addToSearchHistory,
		clearSearchHistory,
		addToPlaybackHistory,
		clearPlaybackHistory,
	};
}

// ============ PLAYLISTS HOOKS ============

/**
 * Playlists state hook
 */
export function usePlaylists() {
	const playlists = useAppStore(selectors.selectPlaylists);
	const selectedPlaylistId = useAppStore(selectors.selectSelectedPlaylistId);

	const createPlaylist = (name: string, description?: string) =>
		useAppStore.getState().createPlaylist(name, description);
	const updatePlaylist = (id: string, name: string, description?: string) =>
		useAppStore.getState().updatePlaylist(id, name, description);
	const deletePlaylist = (id: string) =>
		useAppStore.getState().deletePlaylist(id);
	const addSongToPlaylist = (
		id: string,
		song: import("@/types/entity").DetailedSong,
	) => useAppStore.getState().addSongToPlaylist(id, song);
	const removeSongFromPlaylist = (id: string, songId: string) =>
		useAppStore.getState().removeSongFromPlaylist(id, songId);
	const setSelectedPlaylist = (id: string | null) =>
		useAppStore.getState().setSelectedPlaylist(id);

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

// ============ UI HOOKS ============

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
 * UI actions hook - wrapped with useCallback to provide stable references
 */
export function useUIActions() {
	const setIsMobile = (mobile: boolean) =>
		useAppStore.getState().setIsMobile(mobile);
	const setIsDarkMode = (dark: boolean) =>
		useAppStore.getState().setIsDarkMode(dark);
	const setIsQueueOpen = (open: boolean) =>
		useAppStore.getState().setIsQueueOpen(open);
	const setIsOfflineMode = (offline: boolean) =>
		useAppStore.getState().setIsOfflineMode(offline);
	const setSleepTimer = (minutes: number | null) =>
		useAppStore.getState().setSleepTimer(minutes);

	return {
		setIsMobile,
		setIsDarkMode,
		setIsQueueOpen,
		setIsOfflineMode,
		setSleepTimer,
	};
}

// ============ OFFLINE HOOKS ============

/**
 * Offline state hook
 */
export function useOffline() {
	const downloadedSongIds = useAppStore(selectors.selectDownloadedSongIds);

	const addDownloadedSong = useCallback(
		(songId: string) => useAppStore.getState().addDownloadedSong(songId),
		[],
	);
	const removeDownloadedSong = useCallback(
		(songId: string) => useAppStore.getState().removeDownloadedSong(songId),
		[],
	);
	const isDownloaded = useCallback(
		(songId: string) => useAppStore.getState().isDownloaded(songId),
		[],
	);

	return {
		downloadedSongIds,
		addDownloadedSong,
		removeDownloadedSong,
		isDownloaded,
	};
}

/**
 * Check if a specific song is downloaded
 */
export function useIsDownloaded(songId: string) {
	return useAppStore((state) => state.isDownloaded(songId));
}

/**
 * Offline mode state hook
 */
export const useIsOfflineMode = () =>
	useAppStore(selectors.selectIsOfflineMode);
