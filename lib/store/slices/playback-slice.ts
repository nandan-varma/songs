import {
	clampPlaybackSpeed,
	clampVolume,
	moveItem,
	type StoreGet,
	type StoreSet,
	shuffleQueue,
} from "@/lib/store/internal";
import type { AppStoreActions } from "@/lib/store/types";
import { RESTART_THRESHOLD_SECONDS } from "@/types/player";

export function createPlaybackSlice(
	set: StoreSet,
	_get: StoreGet,
): Pick<
	AppStoreActions,
	| "playSong"
	| "playQueue"
	| "togglePlayPause"
	| "playNext"
	| "playPrevious"
	| "setSongTime"
	| "setSongDuration"
	| "setVolume"
	| "setPlaybackSpeed"
	| "setCurrentSong"
	| "setIsPlaying"
	| "setIsMuted"
	| "toggleMute"
	| "addSongToQueue"
	| "addSongsToQueue"
	| "insertSongNext"
	| "removeSongFromQueue"
	| "clearQueue"
	| "setQueueIndex"
	| "toggleShuffle"
	| "setRepeatMode"
	| "reorderQueue"
> {
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
	};
}
