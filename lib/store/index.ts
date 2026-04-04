"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DetailedSong, LocalPlaylist } from "@/types/entity";
import { DEFAULT_VOLUME, RESTART_THRESHOLD_SECONDS } from "@/types/player";
import type {
	AppStore,
	AppStoreActions,
	AppStoreState,
	PersistedAppStoreState,
} from "./types";

export const APP_STORE_STORAGE_KEY = "songs:app-store";

export const INITIAL_STATE: AppStoreState = {
	currentSong: null,
	isPlaying: false,
	currentTime: 0,
	duration: 0,
	volume: DEFAULT_VOLUME,
	playbackSpeed: 1,
	isMuted: false,
	queue: [],
	queueIndex: 0,
	isShuffleEnabled: false,
	repeatMode: "off",
	favoriteIds: new Set(),
	searchHistory: [],
	playbackHistory: [],
	visitHistory: [],
	maxHistorySize: 100,
	playlists: [],
	isQueueOpen: false,
	downloadedSongIds: new Set(),
	sleepTimerMinutes: null,
};

function clampVolume(volume: number) {
	return Math.max(0, Math.min(1, volume));
}

function clampPlaybackSpeed(speed: number) {
	return Math.max(0.25, Math.min(2, speed));
}

function createPlaylistId() {
	return `playlist_${crypto.randomUUID()}`;
}

function dedupeStrings(items: string[], nextItem: string, maxSize: number) {
	return [nextItem, ...items.filter((item) => item !== nextItem)].slice(
		0,
		maxSize,
	);
}

function dedupeById<T extends { id: string }>(
	items: T[],
	nextItem: T,
	maxSize: number,
) {
	return [nextItem, ...items.filter((item) => item.id !== nextItem.id)].slice(
		0,
		maxSize,
	);
}

function dedupeByEntity<T extends { entityId: string }>(
	items: T[],
	nextItem: T,
	maxSize: number,
) {
	return [
		nextItem,
		...items.filter((item) => item.entityId !== nextItem.entityId),
	].slice(0, maxSize);
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
	const nextItems = [...items];
	const [movedItem] = nextItems.splice(fromIndex, 1);
	if (movedItem === undefined) {
		return items;
	}
	nextItems.splice(toIndex, 0, movedItem);
	return nextItems;
}

function shuffleQueue(queue: DetailedSong[], currentIndex: number) {
	if (queue.length <= 1) {
		return { queue, queueIndex: currentIndex };
	}

	const currentSong = queue[currentIndex] ?? queue[0] ?? null;
	const remainingSongs = queue.filter((_, index) => index !== currentIndex);

	for (let index = remainingSongs.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		const temp = remainingSongs[index];
		remainingSongs[index] = remainingSongs[swapIndex] as DetailedSong;
		remainingSongs[swapIndex] = temp as DetailedSong;
	}

	if (!currentSong) {
		return { queue: remainingSongs, queueIndex: 0 };
	}

	return {
		queue: [currentSong, ...remainingSongs],
		queueIndex: 0,
	};
}

function createActions(
	set: (
		partial: Partial<AppStore> | ((state: AppStore) => Partial<AppStore>),
	) => void,
	get: () => AppStore,
): AppStoreActions {
	return {
		playSong: (song, replaceQueue = true) => {
			set((state) => ({
				currentSong: song,
				isPlaying: true,
				currentTime: 0,
				...(replaceQueue
					? {
							queue: [song],
							queueIndex: 0,
							isShuffleEnabled: false,
						}
					: state.queue.some((item) => item.id === song.id)
						? {
								queueIndex: state.queue.findIndex(
									(item) => item.id === song.id,
								),
							}
						: {}),
			}));
		},
		playQueue: (songs, startIndex = 0) => {
			const safeStartIndex = Math.max(
				0,
				Math.min(startIndex, songs.length - 1),
			);
			const currentSong = songs[safeStartIndex];
			if (!currentSong) {
				return;
			}

			set({
				queue: songs,
				queueIndex: safeStartIndex,
				currentSong,
				isPlaying: true,
				currentTime: 0,
			});
		},
		togglePlayPause: () => {
			set((state) => ({ isPlaying: !state.isPlaying }));
		},
		playNext: () => {
			set((state) => {
				if (state.queue.length === 0) {
					return { isPlaying: false, currentSong: null, currentTime: 0 };
				}

				if (state.repeatMode === "one" && state.currentSong) {
					return { currentTime: 0, isPlaying: true };
				}

				const nextIndex = state.queueIndex + 1;
				const wrappedIndex =
					state.repeatMode === "all" && nextIndex >= state.queue.length
						? 0
						: nextIndex;
				const nextSong = state.queue[wrappedIndex];

				if (!nextSong) {
					return { isPlaying: false, currentTime: 0 };
				}

				return {
					queueIndex: wrappedIndex,
					currentSong: nextSong,
					isPlaying: true,
					currentTime: 0,
				};
			});
		},
		playPrevious: () => {
			set((state) => {
				if (state.currentTime > RESTART_THRESHOLD_SECONDS) {
					return { currentTime: 0 };
				}

				if (state.queue.length === 0) {
					return { currentTime: 0 };
				}

				const previousIndex =
					state.queueIndex === 0
						? state.queue.length - 1
						: state.queueIndex - 1;
				const previousSong = state.queue[previousIndex];
				if (!previousSong) {
					return { currentTime: 0 };
				}

				return {
					queueIndex: previousIndex,
					currentSong: previousSong,
					isPlaying: true,
					currentTime: 0,
				};
			});
		},
		setSongTime: (time) => {
			set({ currentTime: Math.max(0, time) });
		},
		setSongDuration: (duration) => {
			set({ duration: Number.isFinite(duration) ? duration : 0 });
		},
		setVolume: (volume) => {
			set({ volume: clampVolume(volume) });
		},
		setPlaybackSpeed: (speed) => {
			set({ playbackSpeed: clampPlaybackSpeed(speed) });
		},
		setCurrentSong: (song) => {
			set({ currentSong: song });
		},
		setIsPlaying: (playing) => {
			set({ isPlaying: playing });
		},
		setIsMuted: (muted) => {
			set({ isMuted: muted });
		},
		toggleMute: () => {
			set((state) => ({ isMuted: !state.isMuted }));
		},
		addSongToQueue: (song) => {
			set((state) => ({ queue: [...state.queue, song] }));
		},
		addSongsToQueue: (songs) => {
			if (songs.length === 0) {
				return;
			}
			set((state) => ({ queue: [...state.queue, ...songs] }));
		},
		insertSongNext: (song) => {
			set((state) => {
				if (state.queue.length === 0 || state.currentSong === null) {
					return { queue: [song], queueIndex: 0, currentSong: song };
				}

				const insertIndex = Math.min(state.queueIndex + 1, state.queue.length);
				const queue = [...state.queue];
				queue.splice(insertIndex, 0, song);
				return { queue };
			});
		},
		removeSongFromQueue: (index) => {
			set((state) => {
				if (index < 0 || index >= state.queue.length) {
					return {};
				}

				const queue = state.queue.filter(
					(_, queueIndex) => queueIndex !== index,
				);
				if (queue.length === 0) {
					return {
						queue,
						queueIndex: 0,
						currentSong: null,
						currentTime: 0,
						isPlaying: false,
					};
				}

				let queueIndex = state.queueIndex;
				if (index < state.queueIndex) {
					queueIndex -= 1;
				} else if (index === state.queueIndex) {
					queueIndex = Math.min(state.queueIndex, queue.length - 1);
				}

				return {
					queue,
					queueIndex,
					currentSong: queue[queueIndex] ?? null,
				};
			});
		},
		clearQueue: () => {
			set({
				queue: [],
				queueIndex: 0,
				currentSong: null,
				currentTime: 0,
				isPlaying: false,
			});
		},
		setQueueIndex: (index) => {
			set((state) => {
				const queueIndex = Math.max(0, Math.min(index, state.queue.length - 1));
				return {
					queueIndex,
					currentSong: state.queue[queueIndex] ?? null,
					currentTime: 0,
				};
			});
		},
		toggleShuffle: () => {
			set((state) => {
				const isShuffleEnabled = !state.isShuffleEnabled;
				if (!isShuffleEnabled) {
					return { isShuffleEnabled };
				}

				const shuffled = shuffleQueue(state.queue, state.queueIndex);
				return {
					isShuffleEnabled,
					queue: shuffled.queue,
					queueIndex: shuffled.queueIndex,
					currentSong: shuffled.queue[shuffled.queueIndex] ?? state.currentSong,
				};
			});
		},
		setRepeatMode: (mode) => {
			set({ repeatMode: mode });
		},
		reorderQueue: (fromIndex, toIndex) => {
			set((state) => {
				if (
					fromIndex < 0 ||
					toIndex < 0 ||
					fromIndex >= state.queue.length ||
					toIndex >= state.queue.length
				) {
					return {};
				}

				const queue = moveItem(state.queue, fromIndex, toIndex);
				let queueIndex = state.queueIndex;

				if (fromIndex === state.queueIndex) {
					queueIndex = toIndex;
				} else if (
					fromIndex < state.queueIndex &&
					toIndex >= state.queueIndex
				) {
					queueIndex -= 1;
				} else if (
					fromIndex > state.queueIndex &&
					toIndex <= state.queueIndex
				) {
					queueIndex += 1;
				}

				return {
					queue,
					queueIndex,
					currentSong: queue[queueIndex] ?? null,
				};
			});
		},
		toggleFavorite: (songId) => {
			set((state) => {
				const favoriteIds = new Set(state.favoriteIds);
				if (favoriteIds.has(songId)) {
					favoriteIds.delete(songId);
				} else {
					favoriteIds.add(songId);
				}
				return { favoriteIds };
			});
		},
		isFavorite: (songId) => get().favoriteIds.has(songId),
		addFavorite: (songId) => {
			set((state) => ({ favoriteIds: new Set(state.favoriteIds).add(songId) }));
		},
		removeFavorite: (songId) => {
			set((state) => {
				const favoriteIds = new Set(state.favoriteIds);
				favoriteIds.delete(songId);
				return { favoriteIds };
			});
		},
		addToSearchHistory: (query) => {
			const trimmedQuery = query.trim();
			if (!trimmedQuery) {
				return;
			}

			set((state) => ({
				searchHistory: dedupeStrings(
					state.searchHistory,
					trimmedQuery,
					state.maxHistorySize,
				),
			}));
		},
		clearSearchHistory: () => {
			set({ searchHistory: [] });
		},
		addToPlaybackHistory: (song) => {
			set((state) => ({
				playbackHistory: dedupeById(
					state.playbackHistory,
					song,
					state.maxHistorySize,
				),
			}));
		},
		clearPlaybackHistory: () => {
			set({ playbackHistory: [] });
		},
		addToVisitHistory: (visit) => {
			set((state) => ({
				visitHistory: dedupeByEntity(
					state.visitHistory,
					visit,
					state.maxHistorySize,
				),
			}));
		},
		clearVisitHistory: () => {
			set({ visitHistory: [] });
		},
		createPlaylist: (name) => {
			const playlistName = name.trim();
			if (!playlistName) {
				throw new Error("Playlist name is required");
			}

			const playlistId = createPlaylistId();
			const now = Date.now();
			const playlist: LocalPlaylist = {
				id: playlistId,
				name: playlistName,
				songs: [],
				createdAt: now,
				updatedAt: now,
			};

			set((state) => ({ playlists: [...state.playlists, playlist] }));
			return playlistId;
		},
		updatePlaylist: (playlistId, name) => {
			const playlistName = name.trim();
			if (!playlistName) {
				throw new Error("Playlist name is required");
			}

			set((state) => ({
				playlists: state.playlists.map((playlist) =>
					playlist.id === playlistId
						? { ...playlist, name: playlistName, updatedAt: Date.now() }
						: playlist,
				),
			}));
		},
		deletePlaylist: (playlistId) => {
			set((state) => ({
				playlists: state.playlists.filter(
					(playlist) => playlist.id !== playlistId,
				),
			}));
		},
		addSongToPlaylist: (playlistId, song) => {
			set((state) => ({
				playlists: state.playlists.map((playlist) => {
					if (playlist.id !== playlistId) {
						return playlist;
					}

					const songs = playlist.songs.some((item) => item.id === song.id)
						? playlist.songs
						: [...playlist.songs, song];

					return { ...playlist, songs, updatedAt: Date.now() };
				}),
			}));
		},
		removeSongFromPlaylist: (playlistId, songId) => {
			set((state) => ({
				playlists: state.playlists.map((playlist) =>
					playlist.id === playlistId
						? {
								...playlist,
								songs: playlist.songs.filter((song) => song.id !== songId),
								updatedAt: Date.now(),
							}
						: playlist,
				),
			}));
		},
		reorderPlaylistSongs: (playlistId, fromIndex, toIndex) => {
			set((state) => ({
				playlists: state.playlists.map((playlist) => {
					if (playlist.id !== playlistId) {
						return playlist;
					}

					if (
						fromIndex < 0 ||
						toIndex < 0 ||
						fromIndex >= playlist.songs.length ||
						toIndex >= playlist.songs.length
					) {
						return playlist;
					}

					return {
						...playlist,
						songs: moveItem(playlist.songs, fromIndex, toIndex),
						updatedAt: Date.now(),
					};
				}),
			}));
		},
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
			set({ ...INITIAL_STATE });
		},
	};
}

export const useAppStore = create<AppStore>()(
	persist(
		(set, get) => ({
			...INITIAL_STATE,
			...createActions(set as never, get),
		}),
		{
			name: APP_STORE_STORAGE_KEY,
			storage: createJSONStorage(() => localStorage),
			version: 1,
			partialize: (state): PersistedAppStoreState => ({
				favoriteIds: Array.from(state.favoriteIds),
				searchHistory: state.searchHistory,
				playbackHistory: state.playbackHistory,
				visitHistory: state.visitHistory,
				playlists: state.playlists,
				volume: state.volume,
				playbackSpeed: state.playbackSpeed,
				downloadedSongIds: Array.from(state.downloadedSongIds),
				sleepTimerMinutes: state.sleepTimerMinutes,
			}),
			merge: (persistedState, currentState) => {
				if (!persistedState || typeof persistedState !== "object") {
					return currentState;
				}

				const persisted = persistedState as PersistedAppStoreState;
				return {
					...currentState,
					...persisted,
					favoriteIds: new Set(persisted.favoriteIds ?? []),
					downloadedSongIds: new Set(persisted.downloadedSongIds ?? []),
				};
			},
		},
	),
);
