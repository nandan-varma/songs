"use client";

import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	useQueueActions,
	useQueue as useQueueState,
} from "@/contexts/queue-context";
import type { DetailedSong } from "@/lib/types";

/**
 * Split into 3 contexts to minimize re-renders:
 * - PlaybackContext: High frequency updates (currentTime every second)
 * - QueueContext: Medium frequency updates (queue modifications)
 * - PlayerActionsContext: Stable function references (never changes)
 */

interface PlaybackState {
	currentSong: DetailedSong | null;
	isPlaying: boolean;
	volume: number;
	currentTime: number;
	duration: number;
	audioRef: React.RefObject<HTMLAudioElement | null>;
}

interface QueueState {
	queue: DetailedSong[];
	currentIndex: number;
}

interface PlayerActions {
	playSong: (song: DetailedSong, replaceQueue?: boolean) => void;
	playQueue: (songs: DetailedSong[], startIndex?: number) => void;
	addToQueue: (song: DetailedSong) => void;
	addMultipleToQueue: (songs: DetailedSong[]) => void;
	removeFromQueue: (index: number) => void;
	clearQueue: () => void;
	togglePlayPause: () => void;
	playNext: () => void;
	playPrevious: () => void;
	seekTo: (time: number) => void;
	setVolume: (volume: number) => void;
}

const PlaybackContext = createContext<PlaybackState | undefined>(undefined);
const QueueContext = createContext<QueueState | undefined>(undefined);
const PlayerActionsContext = createContext<PlayerActions | undefined>(
	undefined,
);

const DEFAULT_VOLUME = 0.7;
const RESTART_THRESHOLD_SECONDS = 3;
const AUDIO_CHECK_INTERVAL_MS = 100;

export function PlayerProvider({ children }: { children: React.ReactNode }) {
	const audioRef = useRef<HTMLAudioElement>(null);

	const [currentSong, setCurrentSong] = useState<DetailedSong | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);

	const { queue, currentIndex } = useQueueState();
	const { addSong, addSongs, removeSong, clearQueue, setCurrentIndex } =
		useQueueActions();

	/** Play a single song, optionally replacing the queue */
	const playSong = useCallback(
		(song: DetailedSong, replaceQueue = true) => {
			setCurrentSong(song);
			setIsPlaying(true);

			if (replaceQueue) {
				clearQueue();
				addSong(song);
				setCurrentIndex(0);
			}
		},
		[clearQueue, addSong, setCurrentIndex],
	);

	/** Play a queue of songs starting at a specific index */
	const playQueue = useCallback(
		(songs: DetailedSong[], startIndex = 0) => {
			if (songs.length === 0) return;

			clearQueue();
			addSongs(songs);
			setCurrentIndex(startIndex);
			setCurrentSong(songs[startIndex]);
			setIsPlaying(true);
		},
		[clearQueue, addSongs, setCurrentIndex],
	);

	/** Toggle between play and pause states */
	const togglePlayPause = useCallback(() => {
		const audio = audioRef.current;
		if (!audio) return;

		setIsPlaying((prev) => {
			const newState = !prev;
			if (newState) {
				audio.play().catch(() => {});
			} else {
				audio.pause();
			}
			return newState;
		});
	}, []);

	/** Skip to the next song in the queue (loops back to start) */
	const playNext = useCallback(() => {
		if (queue.length === 0) return;

		const nextIndex = (currentIndex + 1) % queue.length;
		setCurrentIndex(nextIndex);
		setCurrentSong(queue[nextIndex]);
		setIsPlaying(true);
	}, [queue, currentIndex, setCurrentIndex]);

	/** Go to previous song, or restart current song if > 3 seconds in */
	const playPrevious = useCallback(() => {
		setCurrentTime((ct) => {
			if (ct > RESTART_THRESHOLD_SECONDS) {
				const audio = audioRef.current;
				if (audio) {
					audio.currentTime = 0;
				}
				return 0;
			}

			if (queue.length === 0) return ct;

			const prevIndex =
				currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
			setCurrentIndex(prevIndex);
			setCurrentSong(queue[prevIndex]);
			setIsPlaying(true);

			return ct;
		});
	}, [queue, currentIndex, setCurrentIndex]);

	/** Seek to a specific time in the current song */
	const seekTo = useCallback((time: number) => {
		const audio = audioRef.current;
		if (audio && !Number.isNaN(time) && Number.isFinite(time)) {
			const clampedTime = Math.max(0, Math.min(audio.duration || 0, time));
			try {
				audio.currentTime = clampedTime;
				setCurrentTime(clampedTime);
			} catch (_error) {
				// Silent error handling for seeking
			}
		}
	}, []);

	/** Set the volume level (0-1) */
	const setVolume = useCallback((newVolume: number) => {
		const clampedVolume = Math.max(0, Math.min(1, newVolume));
		setVolumeState(clampedVolume);
		const audio = audioRef.current;
		if (audio) {
			audio.volume = clampedVolume;
		}
	}, []);

	/** Add a single song to the end of the queue */
	const addToQueue = useCallback(
		(song: DetailedSong) => {
			addSong(song);
		},
		[addSong],
	);

	/** Add multiple songs to the end of the queue */
	const addMultipleToQueue = useCallback(
		(songs: DetailedSong[]) => {
			addSongs(songs);
		},
		[addSongs],
	);

	/** Remove a song from the queue by index */
	const removeFromQueue = useCallback(
		(index: number) => {
			removeSong(index);
		},
		[removeSong],
	);

	/** Clear the entire queue and stop playback */
	const clearQueueAndStop = useCallback(() => {
		clearQueue();
		setCurrentSong(null);
		setIsPlaying(false);
	}, [clearQueue]);

	/**
	 * Set up HTML5 audio element event listeners
	 * Uses a ref to avoid recreating the playNext callback in dependencies
	 * Checks periodically for audio element existence (rendered by child component)
	 */
	const playNextRef = useRef(playNext);

	// Sync currentSong with queue changes
	useEffect(() => {
		if (queue.length > 0 && currentIndex < queue.length) {
			setCurrentSong(queue[currentIndex]);
		} else {
			setCurrentSong(null);
		}
	}, [queue, currentIndex]);

	useEffect(() => {
		playNextRef.current = playNext;
	}, [playNext]);

	useEffect(() => {
		let cleanup: (() => void) | null = null;
		let checkInterval: NodeJS.Timeout | null = null;
		let isActive = true;

		const setupListeners = () => {
			if (!isActive) return false;

			const audio = audioRef.current;
			if (!audio) return false;

			const handleTimeUpdate = () => {
				if (isActive) setCurrentTime(audio.currentTime);
			};
			const handleDurationChange = () => {
				if (isActive) setDuration(audio.duration || 0);
			};
			const handleEnded = () => {
				if (isActive) playNextRef.current();
			};
			const handlePlay = () => {
				if (isActive) setIsPlaying(true);
			};
			const handlePause = () => {
				if (isActive) setIsPlaying(false);
			};
			const handleError = (_e: Event) => {
				if (isActive) setIsPlaying(false);
			};

			audio.addEventListener("timeupdate", handleTimeUpdate);
			audio.addEventListener("durationchange", handleDurationChange);
			audio.addEventListener("ended", handleEnded);
			audio.addEventListener("play", handlePlay);
			audio.addEventListener("pause", handlePause);
			audio.addEventListener("error", handleError);

			cleanup = () => {
				audio.removeEventListener("timeupdate", handleTimeUpdate);
				audio.removeEventListener("durationchange", handleDurationChange);
				audio.removeEventListener("ended", handleEnded);
				audio.removeEventListener("play", handlePlay);
				audio.removeEventListener("pause", handlePause);
				audio.removeEventListener("error", handleError);
			};

			return true;
		};

		// Try to setup listeners immediately
		if (!setupListeners()) {
			// If audio element not ready, poll for it
			checkInterval = setInterval(() => {
				if (setupListeners() && checkInterval) {
					clearInterval(checkInterval);
					checkInterval = null;
				}
			}, AUDIO_CHECK_INTERVAL_MS);
		}

		return () => {
			isActive = false;
			if (cleanup) {
				cleanup();
			}
			if (checkInterval) {
				clearInterval(checkInterval);
			}
		};
	}, []);

	const playbackValue = useMemo<PlaybackState>(
		() => ({
			currentSong,
			isPlaying,
			volume,
			currentTime,
			duration,
			audioRef,
		}),
		[currentSong, isPlaying, volume, currentTime, duration],
	);

	const queueValue = useMemo<QueueState>(
		() => ({
			queue,
			currentIndex,
		}),
		[queue, currentIndex],
	);

	const actionsValue = useMemo<PlayerActions>(
		() => ({
			playSong,
			playQueue,
			addToQueue,
			addMultipleToQueue,
			removeFromQueue,
			clearQueue: clearQueueAndStop,
			togglePlayPause,
			playNext,
			playPrevious,
			seekTo,
			setVolume,
		}),
		[
			playSong,
			playQueue,
			addToQueue,
			addMultipleToQueue,
			removeFromQueue,
			clearQueueAndStop,
			togglePlayPause,
			playNext,
			playPrevious,
			seekTo,
			setVolume,
		],
	);

	return (
		<PlaybackContext.Provider value={playbackValue}>
			<QueueContext.Provider value={queueValue}>
				<PlayerActionsContext.Provider value={actionsValue}>
					{children}
				</PlayerActionsContext.Provider>
			</QueueContext.Provider>
		</PlaybackContext.Provider>
	);
}

/**
 * Access playback state (high frequency updates)
 * Use this when you need currentTime, isPlaying, or volume
 */
export function usePlayback() {
	const context = useContext(PlaybackContext);
	if (context === undefined) {
		throw new Error("usePlayback must be used within a PlayerProvider");
	}
	return context;
}

/**
 * Access queue state (medium frequency updates)
 * Use this when you need the queue array or current index
 */
export function useQueue() {
	const context = useContext(QueueContext);
	if (context === undefined) {
		throw new Error("useQueue must be used within a PlayerProvider");
	}
	return context;
}

/**
 * Access player actions (stable references, never changes)
 * Use this when you only need to control playback, not read state
 * This is the most efficient hook - components won't re-render on state changes
 */
export function usePlayerActions() {
	const context = useContext(PlayerActionsContext);
	if (context === undefined) {
		throw new Error("usePlayerActions must be used within a PlayerProvider");
	}
	return context;
}

/**
 * Access all player state and actions
 * Only use this if you truly need everything - prefer specific hooks above
 * Components using this will re-render on any state change
 */
export function usePlayer() {
	const playback = usePlayback();
	const queue = useQueue();
	const actions = usePlayerActions();

	return useMemo(
		() => ({
			...playback,
			...queue,
			...actions,
		}),
		[playback, queue, actions],
	);
}
