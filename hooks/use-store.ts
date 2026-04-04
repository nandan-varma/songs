"use client";

import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@/lib/store";
import * as selectors from "@/lib/store/selectors";
import type { DetailedSong, EntityVisit } from "@/types/entity";

export { useAppStore };

export const useCurrentSong = () => useAppStore(selectors.selectCurrentSong);
export const useIsPlaying = () => useAppStore(selectors.selectIsPlaying);
export const useCurrentTime = () => useAppStore(selectors.selectCurrentTime);
export const useDuration = () => useAppStore(selectors.selectDuration);
export const useVolume = () => useAppStore(selectors.selectVolume);
export const usePlaybackSpeedValue = () =>
	useAppStore(selectors.selectPlaybackSpeed);
export const useIsMuted = () => useAppStore(selectors.selectIsMuted);
export function usePlayer() {
	return useAppStore(
		useShallow((state) => ({
			currentSong: state.currentSong,
			isPlaying: state.isPlaying,
			currentTime: state.currentTime,
			duration: state.duration,
			volume: state.volume,
			playbackSpeed: state.playbackSpeed,
			isMuted: state.isMuted,
		})),
	);
}

export const useQueueSongs = () => useAppStore(selectors.selectQueue);
export const useQueueIndex = () => useAppStore(selectors.selectQueueIndex);
export const useIsShuffleEnabled = () =>
	useAppStore(selectors.selectIsShuffleEnabled);
export const useRepeatMode = () => useAppStore(selectors.selectRepeatMode);
export const useQueueLength = () => useAppStore(selectors.selectQueueLength);
export function useQueue() {
	return useAppStore(
		useShallow((state) => ({
			queue: state.queue,
			queueIndex: state.queueIndex,
			isShuffleEnabled: state.isShuffleEnabled,
			repeatMode: state.repeatMode,
		})),
	);
}

export function useFavorites() {
	return {
		favoriteIds: useAppStore(selectors.selectFavoriteIds),
		isFavorite: (songId: string) => useAppStore.getState().isFavorite(songId),
		toggleFavorite: (songId: string) =>
			useAppStore.getState().toggleFavorite(songId),
		addFavorite: (songId: string) => useAppStore.getState().addFavorite(songId),
		removeFavorite: (songId: string) =>
			useAppStore.getState().removeFavorite(songId),
	};
}

export function useIsFavorite(songId: string) {
	return useAppStore(selectors.selectIsFavorite(songId));
}

export function useHistory() {
	return {
		searchHistory: useAppStore(selectors.selectSearchHistory),
		playbackHistory: useAppStore(selectors.selectPlaybackHistory),
		visitHistory: useAppStore(selectors.selectVisitHistory),
		addToSearchHistory: (query: string) =>
			useAppStore.getState().addToSearchHistory(query),
		clearSearchHistory: () => useAppStore.getState().clearSearchHistory(),
		addToPlaybackHistory: (song: DetailedSong) =>
			useAppStore.getState().addToPlaybackHistory(song),
		clearPlaybackHistory: () => useAppStore.getState().clearPlaybackHistory(),
		addToVisitHistory: (visit: EntityVisit) =>
			useAppStore.getState().addToVisitHistory(visit),
		clearVisitHistory: () => useAppStore.getState().clearVisitHistory(),
	};
}

export function usePlaylists() {
	return {
		playlists: useAppStore(selectors.selectPlaylists),
		createPlaylist: (name: string) =>
			useAppStore.getState().createPlaylist(name),
		updatePlaylist: (id: string, name: string) =>
			useAppStore.getState().updatePlaylist(id, name),
		deletePlaylist: (id: string) => useAppStore.getState().deletePlaylist(id),
		addSongToPlaylist: (id: string, song: DetailedSong) =>
			useAppStore.getState().addSongToPlaylist(id, song),
		removeSongFromPlaylist: (id: string, songId: string) =>
			useAppStore.getState().removeSongFromPlaylist(id, songId),
		reorderPlaylistSongs: (id: string, fromIndex: number, toIndex: number) =>
			useAppStore.getState().reorderPlaylistSongs(id, fromIndex, toIndex),
	};
}

export function useUIState() {
	return useAppStore(
		useShallow((state) => ({
			isQueueOpen: state.isQueueOpen,
			sleepTimerMinutes: state.sleepTimerMinutes,
		})),
	);
}

export function useUIActions() {
	return {
		setIsQueueOpen: (open: boolean) =>
			useAppStore.getState().setIsQueueOpen(open),
		setSleepTimer: (minutes: number | null) =>
			useAppStore.getState().setSleepTimer(minutes),
	};
}

export function useDownloads() {
	return {
		downloadedSongIds: useAppStore(selectors.selectDownloadedSongIds),
		addDownloadedSong: (songId: string) =>
			useAppStore.getState().addDownloadedSong(songId),
		removeDownloadedSong: (songId: string) =>
			useAppStore.getState().removeDownloadedSong(songId),
		clearDownloadedSongs: () => useAppStore.getState().clearDownloadedSongs(),
		isDownloaded: (songId: string) =>
			useAppStore.getState().isDownloaded(songId),
	};
}

export function useIsDownloaded(songId: string) {
	return useAppStore(selectors.selectIsDownloaded(songId));
}
