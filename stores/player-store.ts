import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { logAudioError } from "@/lib/utils/audio-error";
import type { DetailedSong } from "@/types/entity";
import {
	DEFAULT_VOLUME,
	type PlayerActions,
	type PlayerState,
	type QueueState,
	RESTART_THRESHOLD_SECONDS,
} from "@/types/player";

interface PlayerStore extends PlayerState, QueueState, PlayerActions {
	audioRef: { current: HTMLAudioElement | null };
	setupAudioListeners: () => void;
	// Queue actions
	addSong: (song: DetailedSong) => void;
	addSongs: (songs: DetailedSong[]) => void;
	removeSong: (index: number) => void;
	setCurrentIndex: (index: number) => void;
	setShuffleEnabled: (enabled: boolean) => void;
}

export const usePlayerStore = create<PlayerStore>()(
	subscribeWithSelector((set, get) => {
		// Audio ref
		const audioRef = { current: null as HTMLAudioElement | null };

		// Audio event listeners setup
		const setupAudioListeners = () => {
			const audio = audioRef.current;
			if (!audio) return;

			const handleTimeUpdate = () => set({ currentTime: audio.currentTime });
			const handleDurationChange = () => set({ duration: audio.duration });
			const handleEnded = () => {
				const { playNext } = get();
				playNext();
			};
			const handlePlay = () => set({ isPlaying: true });
			const handlePause = () => set({ isPlaying: false });
			const handleError = (_event: Event) => {
				set({ isPlaying: false, currentTime: 0, duration: 0 });
				logAudioError(audio.error, "PlayerStore");
			};

			audio.addEventListener("timeupdate", handleTimeUpdate);
			audio.addEventListener("durationchange", handleDurationChange);
			audio.addEventListener("ended", handleEnded);
			audio.addEventListener("play", handlePlay);
			audio.addEventListener("pause", handlePause);
			audio.addEventListener("error", handleError);

			// Store cleanup function
			(audio as any)._cleanup = () => {
				audio.removeEventListener("timeupdate", handleTimeUpdate);
				audio.removeEventListener("durationchange", handleDurationChange);
				audio.removeEventListener("ended", handleEnded);
				audio.removeEventListener("play", handlePlay);
				audio.removeEventListener("pause", handlePause);
				audio.removeEventListener("error", handleError);
			};
		};

		// Queue helper functions
		const addSong = (song: DetailedSong) => {
			set((state) => ({ queue: [...state.queue, song] }));
		};

		const addSongs = (songs: DetailedSong[]) => {
			set((state) => ({ queue: [...state.queue, ...songs] }));
		};

		const removeSong = (index: number) => {
			set((state) => {
				const newQueue = state.queue.filter((_, i) => i !== index);
				const newIndex =
					index === state.currentIndex
						? Math.min(state.currentIndex, newQueue.length - 1)
						: index < state.currentIndex
							? state.currentIndex - 1
							: state.currentIndex;
				return { queue: newQueue, currentIndex: Math.max(0, newIndex) };
			});
		};

		const setCurrentIndex = (index: number) => {
			set({ currentIndex: index });
		};

		const setShuffleEnabled = (enabled: boolean) => {
			set({ isShuffleEnabled: enabled });
		};

		return {
			// Playback state
			currentSong: null,
			isPlaying: false,
			volume: DEFAULT_VOLUME,
			currentTime: 0,
			duration: 0,
			audioRef,
			setupAudioListeners,

			// Queue state
			queue: [],
			currentIndex: 0,
			isShuffleEnabled: false,

			// Queue actions
			addSong,
			addSongs,
			removeSong,
			setCurrentIndex,
			setShuffleEnabled,

			// Player actions
			playSong: (song, replaceQueue = true) => {
				set({ currentSong: song, isPlaying: true });

				if (replaceQueue) {
					const { clearQueue } = get();
					clearQueue();
					addSong(song);
					setCurrentIndex(0);
				}
			},

			playQueue: (songs, startIndex = 0) => {
				if (songs.length === 0) return;

				const { clearQueue } = get();
				clearQueue();
				addSongs(songs);
				setCurrentIndex(startIndex);
				const songToPlay = songs[startIndex];
				if (songToPlay) {
					set({ currentSong: songToPlay, isPlaying: true });
				}
			},

			togglePlayPause: () => {
				const audio = audioRef.current;
				if (!audio) return;

				set((state) => {
					const newState = !state.isPlaying;
					if (newState) {
						audio.play().catch(() => {
							set({ isPlaying: false });
						});
					} else {
						audio.pause();
					}
					return { isPlaying: newState };
				});
			},

			playNext: () => {
				const { queue, currentIndex } = get();
				if (queue.length === 0) return;

				const nextIndex = (currentIndex + 1) % queue.length;
				setCurrentIndex(nextIndex);
				const nextSong = queue[nextIndex];
				if (nextSong) {
					set({ currentSong: nextSong, isPlaying: true });
				}
			},

			playPrevious: () => {
				const { queue, currentIndex, currentTime } = get();
				if (currentTime > RESTART_THRESHOLD_SECONDS) {
					const audio = audioRef.current;
					if (audio) {
						audio.currentTime = 0;
					}
					set({ currentTime: 0 });
					return;
				}

				if (queue.length === 0) return;

				const prevIndex =
					currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
				setCurrentIndex(prevIndex);
				const prevSong = queue[prevIndex];
				if (prevSong) {
					set({ currentSong: prevSong, isPlaying: true });
				}
			},

			seekTo: (time) => {
				const audio = audioRef.current;
				if (audio && !Number.isNaN(time) && Number.isFinite(time)) {
					const clampedTime = Math.max(0, Math.min(audio.duration || 0, time));
					try {
						audio.currentTime = clampedTime;
						set({ currentTime: clampedTime });
					} catch (_error) {
						// Silent error handling for seeking
					}
				}
			},

			setVolume: (volume) => {
				const clampedVolume = Math.max(0, Math.min(1, volume));
				set({ volume: clampedVolume });
				const audio = audioRef.current;
				if (audio) {
					audio.volume = clampedVolume;
				}
			},

			addToQueue: (song) => {
				addSong(song);
			},

			addMultipleToQueue: (songs) => {
				addSongs(songs);
			},

			removeFromQueue: (index) => {
				removeSong(index);
			},

			reorderQueue: (fromIndex, toIndex) => {
				if (fromIndex === toIndex) return;

				set((state) => {
					const newQueue = [...state.queue];
					const [movedSong] = newQueue.splice(fromIndex, 1);
					if (movedSong) {
						newQueue.splice(toIndex, 0, movedSong);
					}

					let newIndex = state.currentIndex;
					if (newIndex === fromIndex) {
						newIndex = toIndex;
					} else if (fromIndex < newIndex && toIndex >= newIndex) {
						newIndex -= 1;
					} else if (fromIndex > newIndex && toIndex <= newIndex) {
						newIndex += 1;
					}

					return { queue: newQueue, currentIndex: newIndex };
				});
			},

			clearQueue: () => {
				set({
					queue: [],
					currentIndex: 0,
					currentSong: null,
					isPlaying: false,
				});
			},
		};
	}),
);

// Selectors for performance (equivalent to the 3 contexts)
export const usePlayback = () =>
	usePlayerStore((state) => ({
		currentSong: state.currentSong,
		isPlaying: state.isPlaying,
		volume: state.volume,
		currentTime: state.currentTime,
		duration: state.duration,
		audioRef: state.audioRef,
	}));

export const useQueue = () =>
	usePlayerStore((state) => ({
		queue: state.queue,
		currentIndex: state.currentIndex,
		isShuffleEnabled: state.isShuffleEnabled,
	}));

export const usePlayerActions = () =>
	usePlayerStore((state) => ({
		playSong: state.playSong,
		playQueue: state.playQueue,
		addToQueue: state.addToQueue,
		addMultipleToQueue: state.addMultipleToQueue,
		removeFromQueue: state.removeFromQueue,
		reorderQueue: state.reorderQueue,
		clearQueue: state.clearQueue,
		togglePlayPause: state.togglePlayPause,
		playNext: state.playNext,
		playPrevious: state.playPrevious,
		seekTo: state.seekTo,
		setVolume: state.setVolume,
	}));

export const usePlayer = () => {
	const playback = usePlayback();
	const queue = useQueue();
	const actions = usePlayerActions();

	return {
		...playback,
		...queue,
		...actions,
	};
};
