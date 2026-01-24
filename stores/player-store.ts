import type React from "react";
import { toast } from "sonner";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { logError } from "@/lib/utils/logger";
import type {
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
	DetailedSong,
} from "@/types/entity";
import { DEFAULT_VOLUME, RESTART_THRESHOLD_SECONDS } from "@/types/player";

const SHUFFLE_STORAGE_KEY = "music-app-shuffle-enabled";

interface PlayerStore {
	// Player state
	audioRef: React.RefObject<HTMLAudioElement> | null;
	currentSong: DetailedSong | null;
	isPlaying: boolean;
	isLoading: boolean;
	volume: number;
	currentTime: number;
	duration: number;

	// Queue state
	queue: DetailedSong[];
	currentIndex: number;
	originalQueue: DetailedSong[];
	isShuffleEnabled: boolean;

	// Player actions
	setAudioRef: (ref: React.RefObject<HTMLAudioElement>) => void;
	setCurrentTime: (time: number) => void;
	setDuration: (duration: number) => void;
	setIsPlaying: (playing: boolean) => void;
	setIsLoading: (loading: boolean) => void;
	setVolume: (volume: number) => void;
	setCurrentSong: (song: DetailedSong | null) => void;

	// Playback actions
	playSong: (song: DetailedSong, replaceQueue?: boolean) => void;
	playQueue: (songs: DetailedSong[], startIndex?: number) => void;
	playNext: () => void;
	playPrevious: () => void;
	togglePlayPause: () => void;
	seekTo: (time: number) => void;

	// Queue actions
	setCurrentIndex: (index: number) => void;
	addSong: (song: DetailedSong) => void;
	addSongs: (songs: DetailedSong[]) => void;
	addAlbum: (album: DetailedAlbum) => void;
	addArtist: (artist: DetailedArtist) => void;
	addPlaylist: (playlist: DetailedPlaylist) => void;
	insertSongAt: (song: DetailedSong, index: number) => void;
	removeSong: (index: number) => void;
	reorderQueue: (fromIndex: number, toIndex: number) => void;
	clearQueue: () => void;
	toggleShuffle: () => void;
	setShuffleEnabled: (enabled: boolean) => void;
}

function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = shuffled[i] as T;
		shuffled[i] = shuffled[j] as T;
		shuffled[j] = temp;
	}
	return shuffled;
}

export const usePlayerStore = create<PlayerStore>()(
	devtools(
		(set, get) => ({
			// Initial player state
			audioRef: null,
			currentSong: null,
			isPlaying: false,
			isLoading: false,
			volume: DEFAULT_VOLUME,
			currentTime: 0,
			duration: 0,

			// Initial queue state
			queue: [],
			currentIndex: 0,
			originalQueue: [],
			isShuffleEnabled:
				typeof window !== "undefined"
					? localStorage.getItem(SHUFFLE_STORAGE_KEY) === "true"
					: false,

			// Player setters
			setAudioRef: (ref) => set({ audioRef: ref }),
			setCurrentTime: (time) => set({ currentTime: time }),
			setDuration: (duration) => set({ duration }),
			setIsPlaying: (playing) => set({ isPlaying: playing }),
			setIsLoading: (loading) => set({ isLoading: loading }),
			setVolume: (volume) => set({ volume }),
			setCurrentSong: (song) => set({ currentSong: song }),

			// Playback actions
			playSong: (song, replaceQueue = true) => {
				set({ currentSong: song });
				if (replaceQueue) {
					set({
						queue: [song],
						currentIndex: 0,
						originalQueue: [],
					});
				}
			},

			playQueue: (songs, startIndex = 0) => {
				if (songs.length === 0) return;
				const songToPlay = songs[startIndex];
				if (songToPlay) {
					set({
						queue: songs,
						currentIndex: startIndex,
						currentSong: songToPlay,
						originalQueue: [],
					});
				}
			},

			playNext: () => {
				const { queue, currentIndex } = get();
				if (queue.length === 0) return;

				const nextIndex = (currentIndex + 1) % queue.length;
				const nextSong = queue[nextIndex];
				if (nextSong) {
					set({
						currentIndex: nextIndex,
						currentSong: nextSong,
					});
				}
			},

			playPrevious: () => {
				const { queue, currentIndex, currentTime, audioRef } = get();
				if (currentTime > RESTART_THRESHOLD_SECONDS) {
					if (audioRef?.current) {
						audioRef.current.currentTime = 0;
					}
					set({ currentTime: 0 });
					return;
				}

				if (queue.length === 0) return;

				const prevIndex =
					currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
				const prevSong = queue[prevIndex];
				if (prevSong) {
					set({
						currentIndex: prevIndex,
						currentSong: prevSong,
					});
				}
			},

			togglePlayPause: () => {
				const { audioRef, isPlaying, currentSong } = get();
				if (!audioRef?.current || !currentSong) return;

				if (isPlaying) {
					// Pause - state will be updated by 'pause' event
					audioRef.current.pause();
				} else {
					// Play - state will be updated by 'play' event
					audioRef.current.play().catch((error) => {
						logError("PlayerStore.togglePlayPause", error);
						// Only set to false if play fails
						set({ isPlaying: false });
					});
				}
			},

			seekTo: (time) => {
				const { audioRef } = get();
				if (audioRef?.current) {
					audioRef.current.currentTime = time;
					set({ currentTime: time });
				}
			},

			// Queue actions
			setCurrentIndex: (index) => set({ currentIndex: index }),

			addSong: (song) => {
				const { queue } = get();
				const isDuplicate = queue.some((s) => s.id === song.id);
				if (isDuplicate) {
					toast.info(`"${song.name}" is already in queue`);
					return;
				}
				set({ queue: [...queue, song] });
			},

			addSongs: (songs) => {
				const { queue } = get();
				try {
					const existingIds = new Set(queue.map((s) => s.id));
					const newSongs = songs.filter((song) => !existingIds.has(song.id));

					if (newSongs.length === 0) {
						toast.info("All songs are already in queue");
						return;
					}

					const duplicateCount = songs.length - newSongs.length;
					if (duplicateCount > 0) {
						toast.info(
							`Added ${newSongs.length} songs, skipped ${duplicateCount} duplicate${duplicateCount > 1 ? "s" : ""}`,
						);
					}

					set({ queue: [...queue, ...newSongs] });
				} catch (error) {
					logError("PlayerStore.addSongs", error);
					toast.error("Failed to add songs to queue");
				}
			},

			addAlbum: (album) => {
				get().addSongs(album.songs || []);
			},

			addArtist: (artist) => {
				get().addSongs(artist.topSongs || []);
			},

			addPlaylist: (playlist) => {
				get().addSongs(playlist.songs || []);
			},

			insertSongAt: (song, index) => {
				const { queue, currentIndex } = get();
				const isDuplicate = queue.some((s) => s.id === song.id);
				if (isDuplicate) {
					toast.info(`"${song.name}" is already in queue`);
					return;
				}

				const newQueue = [...queue];
				newQueue.splice(index, 0, song);

				// Adjust currentIndex if needed
				const newCurrentIndex =
					index <= currentIndex ? currentIndex + 1 : currentIndex;
				set({ queue: newQueue, currentIndex: newCurrentIndex });
			},

			removeSong: (index) => {
				const { queue, currentIndex } = get();
				const newQueue = queue.filter((_, i) => i !== index);

				let newCurrentIndex = currentIndex;
				if (index === currentIndex) {
					// Removing current song - don't change index
				} else if (index < currentIndex) {
					newCurrentIndex = currentIndex - 1;
				}

				set({ queue: newQueue, currentIndex: newCurrentIndex });
			},

			reorderQueue: (fromIndex, toIndex) => {
				const { queue, currentIndex } = get();
				const newQueue = [...queue];
				const [removed] = newQueue.splice(fromIndex, 1);
				if (removed) {
					newQueue.splice(toIndex, 0, removed);
				}

				// Adjust currentIndex
				let newCurrentIndex = currentIndex;
				if (fromIndex === currentIndex) {
					newCurrentIndex = toIndex;
				} else if (fromIndex < currentIndex && toIndex >= currentIndex) {
					newCurrentIndex = currentIndex - 1;
				} else if (fromIndex > currentIndex && toIndex <= currentIndex) {
					newCurrentIndex = currentIndex + 1;
				}

				set({ queue: newQueue, currentIndex: newCurrentIndex });
			},

			clearQueue: () => {
				set({
					queue: [],
					currentIndex: 0,
					originalQueue: [],
					currentSong: null,
					isPlaying: false,
				});
			},

			toggleShuffle: () => {
				const { isShuffleEnabled } = get();
				get().setShuffleEnabled(!isShuffleEnabled);
			},

			setShuffleEnabled: (enabled) => {
				const { queue, originalQueue, isShuffleEnabled } = get();
				if (isShuffleEnabled === enabled) return;

				if (enabled && queue.length > 0) {
					const currentSong = queue[0];
					if (!currentSong) return;
					const remainingSongs = queue.slice(1);
					const shuffled = shuffleArray(remainingSongs);
					set({
						originalQueue: queue,
						queue: [currentSong, ...shuffled],
						isShuffleEnabled: true,
					});
				} else if (!enabled && originalQueue.length > 0) {
					set({
						queue: originalQueue,
						originalQueue: [],
						isShuffleEnabled: false,
					});
				} else {
					set({ isShuffleEnabled: enabled });
				}

				if (typeof window !== "undefined") {
					localStorage.setItem(SHUFFLE_STORAGE_KEY, String(enabled));
				}
			},
		}),
		{ name: "player-store" },
	),
);

// Convenience hooks for specific slices
export const usePlaybackState = () => {
	const currentSong = usePlayerStore((state) => state.currentSong);
	const isPlaying = usePlayerStore((state) => state.isPlaying);
	const isLoading = usePlayerStore((state) => state.isLoading);
	const volume = usePlayerStore((state) => state.volume);
	const currentTime = usePlayerStore((state) => state.currentTime);
	const duration = usePlayerStore((state) => state.duration);
	const audioRef = usePlayerStore((state) => state.audioRef);

	return {
		currentSong,
		isPlaying,
		isLoading,
		volume,
		currentTime,
		duration,
		audioRef,
	};
};

export const useQueueState = () => {
	const queue = usePlayerStore((state) => state.queue);
	const currentIndex = usePlayerStore((state) => state.currentIndex);
	const isShuffleEnabled = usePlayerStore((state) => state.isShuffleEnabled);

	return {
		queue,
		currentIndex,
		isShuffleEnabled,
	};
};

export const usePlayerActions = () => {
	const playSong = usePlayerStore((state) => state.playSong);
	const playQueue = usePlayerStore((state) => state.playQueue);
	const playNext = usePlayerStore((state) => state.playNext);
	const playPrevious = usePlayerStore((state) => state.playPrevious);
	const togglePlayPause = usePlayerStore((state) => state.togglePlayPause);
	const seekTo = usePlayerStore((state) => state.seekTo);
	const setVolume = usePlayerStore((state) => state.setVolume);
	const addSong = usePlayerStore((state) => state.addSong);
	const addSongs = usePlayerStore((state) => state.addSongs);
	const addAlbum = usePlayerStore((state) => state.addAlbum);
	const addArtist = usePlayerStore((state) => state.addArtist);
	const addPlaylist = usePlayerStore((state) => state.addPlaylist);
	const insertSongAt = usePlayerStore((state) => state.insertSongAt);
	const removeSong = usePlayerStore((state) => state.removeSong);
	const reorderQueue = usePlayerStore((state) => state.reorderQueue);
	const clearQueue = usePlayerStore((state) => state.clearQueue);
	const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
	const setShuffleEnabled = usePlayerStore((state) => state.setShuffleEnabled);

	return {
		playSong,
		playQueue,
		playNext,
		playPrevious,
		togglePlayPause,
		seekTo,
		setVolume,
		addSong,
		addSongs,
		addAlbum,
		addArtist,
		addPlaylist,
		insertSongAt,
		removeSong,
		reorderQueue,
		clearQueue,
		toggleShuffle,
		setShuffleEnabled,
	};
};
