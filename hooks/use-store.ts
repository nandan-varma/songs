"use client";

import { useAppStore } from "@/lib/store";
import * as selectors from "@/lib/store/selectors";

/**
 * Player state hook
 */
export function usePlayer() {
	return useAppStore(selectors.selectPlayerState);
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
 * Queue state hook
 */
export function useQueue() {
	return useAppStore(selectors.selectQueueState);
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
	return useAppStore((state) => ({
		favoriteIds: state.favoriteIds,
		toggleFavorite: state.toggleFavorite,
		addFavorite: state.addFavorite,
		removeFavorite: state.removeFavorite,
		isFavorite: state.isFavorite,
	}));
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
	return useAppStore((state) => ({
		searchHistory: state.searchHistory,
		playbackHistory: state.playbackHistory,
		addToSearchHistory: state.addToSearchHistory,
		clearSearchHistory: state.clearSearchHistory,
		addToPlaybackHistory: state.addToPlaybackHistory,
		clearPlaybackHistory: state.clearPlaybackHistory,
	}));
}

/**
 * Playlists hook
 */
export function usePlaylists() {
	return useAppStore((state) => ({
		playlists: state.playlists,
		selectedPlaylistId: state.selectedPlaylistId,
		createPlaylist: state.createPlaylist,
		updatePlaylist: state.updatePlaylist,
		deletePlaylist: state.deletePlaylist,
		addSongToPlaylist: state.addSongToPlaylist,
		removeSongFromPlaylist: state.removeSongFromPlaylist,
		setSelectedPlaylist: state.setSelectedPlaylist,
	}));
}

/**
 * UI state hook
 */
export function useUIState() {
	return useAppStore((state) => ({
		isMobile: state.isMobile,
		isDarkMode: state.isDarkMode,
		isQueueOpen: state.isQueueOpen,
		isOfflineMode: state.isOfflineMode,
		sleepTimerMinutes: state.sleepTimerMinutes,
	}));
}

/**
 * UI actions hook
 */
export function useUIActions() {
	return useAppStore((state) => ({
		setIsMobile: state.setIsMobile,
		setIsDarkMode: state.setIsDarkMode,
		setIsQueueOpen: state.setIsQueueOpen,
		setIsOfflineMode: state.setIsOfflineMode,
		setSleepTimer: state.setSleepTimer,
	}));
}

/**
 * Offline hook
 */
export function useOffline() {
	return useAppStore((state) => ({
		downloadedSongIds: state.downloadedSongIds,
		addDownloadedSong: state.addDownloadedSong,
		removeDownloadedSong: state.removeDownloadedSong,
		isDownloaded: state.isDownloaded,
	}));
}

/**
 * Check if a song is downloaded
 */
export function useIsDownloaded(songId: string) {
	return useAppStore((state) => state.isDownloaded(songId));
}
