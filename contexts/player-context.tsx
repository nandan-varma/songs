"use client";

import type React from "react";
import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { usePlayerStore } from "@/stores/player-store";
import type { PlayerActions, PlayerState, QueueState } from "@/types/player";

const PlaybackContext = createContext<PlayerState | undefined>(undefined);
const QueueContext = createContext<QueueState | undefined>(undefined);
const PlayerActionsContext = createContext<PlayerActions | undefined>(
	undefined,
);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
	const store = usePlayerStore();
	const audioRef = useRef<HTMLAudioElement>(null);

	// Setup audio listeners when audio element is available
	useEffect(() => {
		if (audioRef.current) {
			store.audioRef.current = audioRef.current;
			store.setupAudioListeners();
		}
	}, [store]);

	const playbackValue: PlayerState = {
		currentSong: store.currentSong,
		isPlaying: store.isPlaying,
		volume: store.volume,
		currentTime: store.currentTime,
		duration: store.duration,
		audioRef: store.audioRef,
	};

	const queueValue: QueueState = {
		queue: store.queue,
		currentIndex: store.currentIndex,
		isShuffleEnabled: store.isShuffleEnabled,
	};

	const actionsValue: PlayerActions = {
		playSong: store.playSong,
		playQueue: store.playQueue,
		addToQueue: store.addToQueue,
		addMultipleToQueue: store.addMultipleToQueue,
		removeFromQueue: store.removeFromQueue,
		reorderQueue: store.reorderQueue,
		clearQueue: store.clearQueue,
		togglePlayPause: store.togglePlayPause,
		playNext: store.playNext,
		playPrevious: store.playPrevious,
		seekTo: store.seekTo,
		setVolume: store.setVolume,
	};

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
