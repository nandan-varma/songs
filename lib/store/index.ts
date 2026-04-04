"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { DetailedSong, LocalPlaylist } from "@/types/entity";
import { DEFAULT_VOLUME, RESTART_THRESHOLD_SECONDS } from "@/types/player";
import type { AppStore, AppStoreState, RepeatMode } from "./types";

const INITIAL_STATE: AppStoreState = {
	// Player
	currentSong: null,
	isPlaying: false,
	currentTime: 0,
	duration: 0,
	volume: DEFAULT_VOLUME,
	playbackSpeed: 1,

	// Queue
	queue: [],
	queueIndex: 0,
	isShuffleEnabled: false,
	repeatMode: "off",

	// Favorites
	favoriteIds: new Set(),

	// History
	searchHistory: [],
	playbackHistory: [],
	maxHistorySize: 100,

	// Playlists
	playlists: [],
	selectedPlaylistId: null,

	// UI
	isMobile: false,
	isDarkMode: false,
	isQueueOpen: false,
	isOfflineMode: false,

	// Offline
	downloadedSongIds: new Set(),
	sleepTimerMinutes: null,
};

export const useAppStore = create<AppStore>()(
	subscribeWithSelector((set, get) => ({
		...INITIAL_STATE,

		// ============ PLAYER ACTIONS ============
		playSong: (song: DetailedSong, replaceQueue = true) => {
			set((state) => {
				if (replaceQueue) {
					return {
						currentSong: song,
						isPlaying: true,
						queue: [song],
						queueIndex: 0,
						currentTime: 0,
					};
				}
				return {
					currentSong: song,
					isPlaying: true,
				};
			});
		},

		playQueue: (songs: DetailedSong[], startIndex = 0) => {
			if (songs.length === 0) return;
			const song = songs[startIndex];
			if (!song) return;
			set({
				queue: songs,
				queueIndex: startIndex,
				currentSong: song,
				isPlaying: true,
				currentTime: 0,
			});
		},

		togglePlayPause: () => {
			set((state) => ({
				isPlaying: !state.isPlaying,
			}));
		},

		playNext: () => {
			set((state) => {
				if (state.queue.length === 0) return state;

				let nextIndex = state.queueIndex + 1;

				if (state.repeatMode === "all" && nextIndex >= state.queue.length) {
					nextIndex = 0;
				}

				if (nextIndex >= state.queue.length) {
					return {
						isPlaying: false,
						currentTime: 0,
					};
				}

				const song = state.queue[nextIndex];
				if (!song) return state;

				return {
					queueIndex: nextIndex,
					currentSong: song,
					isPlaying: true,
					currentTime: 0,
				};
			});
		},

		playPrevious: () => {
			set((state) => {
				const currentTime = state.currentTime;

				// If more than 3 seconds into song, restart it
				if (currentTime > RESTART_THRESHOLD_SECONDS) {
					return {
						currentTime: 0,
					};
				}

				if (state.queue.length === 0) return state;

				const prevIndex =
					state.queueIndex === 0
						? state.queue.length - 1
						: state.queueIndex - 1;

				const song = state.queue[prevIndex];
				if (!song) return state;

				return {
					queueIndex: prevIndex,
					currentSong: song,
					isPlaying: true,
					currentTime: 0,
				};
			});
		},

		setSongTime: (time: number) => {
			set({ currentTime: time });
		},

		setSongDuration: (duration: number) => {
			set({ duration });
		},

		setVolume: (volume: number) => {
			set({ volume: Math.max(0, Math.min(1, volume)) });
		},

		setPlaybackSpeed: (speed: number) => {
			set({ playbackSpeed: Math.max(0.25, Math.min(2, speed)) });
		},

		setCurrentSong: (song: DetailedSong | null) => {
			set({ currentSong: song });
		},

		setIsPlaying: (playing: boolean) => {
			set({ isPlaying: playing });
		},

		// ============ QUEUE ACTIONS ============
		addSongToQueue: (song: DetailedSong) => {
			set((state) => ({
				queue: [...state.queue, song],
			}));
		},

		addSongsToQueue: (songs: DetailedSong[]) => {
			set((state) => ({
				queue: [...state.queue, ...songs],
			}));
		},

		removeSongFromQueue: (index: number) => {
			set((state) => {
				const newQueue = state.queue.filter((_, i) => i !== index);
				let newIndex = state.queueIndex;

				if (index < state.queueIndex) {
					newIndex = Math.max(0, newIndex - 1);
				} else if (index === state.queueIndex && newIndex >= newQueue.length) {
					newIndex = Math.max(0, newQueue.length - 1);
				}

				return {
					queue: newQueue,
					queueIndex: newIndex,
					currentSong: newQueue[newIndex] || null,
				};
			});
		},

		clearQueue: () => {
			set({
				queue: [],
				queueIndex: 0,
				currentSong: null,
				isPlaying: false,
				currentTime: 0,
			});
		},

		setQueueIndex: (index: number) => {
			set((state) => ({
				queueIndex: Math.max(0, Math.min(index, state.queue.length - 1)),
				currentSong: state.queue[index] || null,
			}));
		},

		toggleShuffle: () => {
			set((state) => {
				const newShuffleState = !state.isShuffleEnabled;

				if (newShuffleState) {
					// Fisher-Yates shuffle
					const shuffled = [...state.queue];
					for (let i = shuffled.length - 1; i > 0; i--) {
						const j = Math.floor(Math.random() * (i + 1));
						const item = shuffled[i]!;
						shuffled[i] = shuffled[j]!;
						shuffled[j] = item;
					}
					const firstSong = shuffled[0];
					return {
						isShuffleEnabled: newShuffleState,
						queue: shuffled,
						queueIndex: 0,
						currentSong: firstSong || null,
					};
				}

				return {
					isShuffleEnabled: newShuffleState,
				};
			});
		},

		setRepeatMode: (mode: RepeatMode) => {
			set({ repeatMode: mode });
		},

		reorderQueue: (fromIndex: number, toIndex: number) => {
			set((state) => {
				const newQueue = [...state.queue];
				const movedItem = newQueue[fromIndex];
				if (!movedItem) return state;

				newQueue.splice(fromIndex, 1);
				newQueue.splice(toIndex, 0, movedItem);

				let newIndex = state.queueIndex;
				if (fromIndex === state.queueIndex) {
					newIndex = toIndex;
				} else if (
					fromIndex < state.queueIndex &&
					toIndex >= state.queueIndex
				) {
					newIndex = state.queueIndex - 1;
				} else if (fromIndex > state.queueIndex && toIndex < state.queueIndex) {
					newIndex = state.queueIndex + 1;
				}

				return {
					queue: newQueue,
					queueIndex: newIndex,
				};
			});
		},

		// ============ FAVORITES ACTIONS ============
		toggleFavorite: (songId: string) => {
			set((state) => {
				const newFavorites = new Set(state.favoriteIds);
				if (newFavorites.has(songId)) {
					newFavorites.delete(songId);
				} else {
					newFavorites.add(songId);
				}
				return { favoriteIds: newFavorites };
			});
		},

		isFavorite: (songId: string) => {
			return get().favoriteIds.has(songId);
		},

		addFavorite: (songId: string) => {
			set((state) => {
				const newFavorites = new Set(state.favoriteIds);
				newFavorites.add(songId);
				return { favoriteIds: newFavorites };
			});
		},

		removeFavorite: (songId: string) => {
			set((state) => {
				const newFavorites = new Set(state.favoriteIds);
				newFavorites.delete(songId);
				return { favoriteIds: newFavorites };
			});
		},

		// ============ HISTORY ACTIONS ============
		addToSearchHistory: (query: string) => {
			set((state) => {
				let newHistory = [
					query,
					...state.searchHistory.filter((q) => q !== query),
				];
				if (newHistory.length > state.maxHistorySize) {
					newHistory = newHistory.slice(0, state.maxHistorySize);
				}
				return { searchHistory: newHistory };
			});
		},

		clearSearchHistory: () => {
			set({ searchHistory: [] });
		},

		addToPlaybackHistory: (song: DetailedSong) => {
			set((state) => {
				const newHistory = [song, ...state.playbackHistory];
				if (newHistory.length > state.maxHistorySize) {
					return {
						playbackHistory: newHistory.slice(0, state.maxHistorySize),
					};
				}
				return { playbackHistory: newHistory };
			});
		},

		clearPlaybackHistory: () => {
			set({ playbackHistory: [] });
		},

		// ============ PLAYLIST ACTIONS ============
		createPlaylist: (name: string, description = "") => {
			set((state) => {
				const newPlaylist: LocalPlaylist = {
					id: `playlist_${Date.now()}`,
					name,
					songs: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				};
				return {
					playlists: [...state.playlists, newPlaylist],
				};
			});
		},

		updatePlaylist: (playlistId: string, name: string, description = "") => {
			set((state) => ({
				playlists: state.playlists.map((pl) =>
					pl.id === playlistId ? { ...pl, name, updatedAt: Date.now() } : pl,
				),
			}));
		},

		deletePlaylist: (playlistId: string) => {
			set((state) => ({
				playlists: state.playlists.filter((pl) => pl.id !== playlistId),
				selectedPlaylistId:
					state.selectedPlaylistId === playlistId
						? null
						: state.selectedPlaylistId,
			}));
		},

		addSongToPlaylist: (playlistId: string, song: DetailedSong) => {
			set((state) => ({
				playlists: state.playlists.map((pl) =>
					pl.id === playlistId
						? {
								...pl,
								songs: [...pl.songs, song],
								updatedAt: Date.now(),
							}
						: pl,
				),
			}));
		},

		removeSongFromPlaylist: (playlistId: string, songId: string) => {
			set((state) => ({
				playlists: state.playlists.map((pl) =>
					pl.id === playlistId
						? {
								...pl,
								songs: pl.songs.filter((s) => s.id !== songId),
								updatedAt: Date.now(),
							}
						: pl,
				),
			}));
		},

		setSelectedPlaylist: (playlistId: string | null) => {
			set({ selectedPlaylistId: playlistId });
		},

		// ============ UI ACTIONS ============
		setIsMobile: (mobile: boolean) => {
			set({ isMobile: mobile });
		},

		setIsDarkMode: (dark: boolean) => {
			set({ isDarkMode: dark });
		},

		setIsQueueOpen: (open: boolean) => {
			set({ isQueueOpen: open });
		},

		setIsOfflineMode: (offline: boolean) => {
			set({ isOfflineMode: offline });
		},

		setSleepTimer: (minutes: number | null) => {
			set({ sleepTimerMinutes: minutes });
		},

		// ============ OFFLINE ACTIONS ============
		addDownloadedSong: (songId: string) => {
			set((state) => {
				const newDownloaded = new Set(state.downloadedSongIds);
				newDownloaded.add(songId);
				return { downloadedSongIds: newDownloaded };
			});
		},

		removeDownloadedSong: (songId: string) => {
			set((state) => {
				const newDownloaded = new Set(state.downloadedSongIds);
				newDownloaded.delete(songId);
				return { downloadedSongIds: newDownloaded };
			});
		},

		isDownloaded: (songId: string) => {
			return get().downloadedSongIds.has(songId);
		},

		// ============ RESET ============
		resetStore: () => {
			set(INITIAL_STATE);
		},
	})),
);
