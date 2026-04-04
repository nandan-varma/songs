"use client";

import { useCallback } from "react";
import { useAudioPlayback } from "@/hooks/audio/use-audio-playback";
import { useAudioSource } from "@/hooks/audio/use-audio-source";
import { useMediaSession } from "@/hooks/audio/use-media-session";
import { useOffline } from "@/hooks/cache";
import { useOfflineSkip } from "@/hooks/player/use-offline-skip";
import {
	usePlayer,
	usePlayerActions,
	useQueue,
	useQueueActions,
} from "@/hooks/use-store";
import { DesktopLayout } from "./player/desktop-layout";
import { MobileLayout } from "./player/mobile-layout";
import { PlayerContainer } from "./player/player-container";

/**
 * Persistent audio player UI with Zustand store to minimize re-renders
 */
export function AudioPlayer() {
	const { currentSong, isPlaying, volume, currentTime, duration } = usePlayer();
	const { queue, queueIndex } = useQueue();

	// Note: audioRef is managed separately from the store
	// It should be created in a parent component or via useRef
	const audioRef = null as any; // TODO: Wire in proper audio ref handling
	const {
		togglePlayPause,
		playNext,
		playPrevious,
		setSongTime: seekTo,
		setVolume,
	} = usePlayerActions();
	const { removeSongFromQueue, reorderQueue } = useQueueActions();
	const isOfflineMode = useOffline();

	// Wrapper to convert async isSongCached to sync for useOfflineSkip
	const isSongCachedSync = useCallback((_songId: string): boolean => {
		// This is a limitation - we need a synchronous check
		// For now, we'll return false and rely on the async check elsewhere
		return false;
	}, []);

	// Create a mock getSongBlob function for useAudioSource
	const getSongBlob = useCallback(
		async (_songId: string): Promise<Blob | null> => {
			// This should fetch from cacheManager
			// TODO: Implement proper blob retrieval from cache
			return null;
		},
		[],
	);

	// Audio management hooks - each with single responsibility
	useOfflineSkip({
		currentSong,
		isOfflineMode,
		isSongCached: isSongCachedSync,
		playNext,
	});
	useAudioSource({
		currentSong,
		audioRef,
		isOfflineMode,
		getSongBlob,
	});
	useAudioSource({
		currentSong,
		audioRef,
		isOfflineMode,
		getSongBlob,
	});
	useAudioPlayback({ currentSong, audioRef, isPlaying });
	useMediaSession({
		currentSong,
		audioRef,
		isPlaying,
		currentTime,
		duration,
		playNext,
		playPrevious,
		seekTo,
	});

	const hasCurrentSong = !!currentSong;

	const layoutProps = {
		currentSong: currentSong ?? null,
		isPlaying: hasCurrentSong && isPlaying,
		volume,
		currentTime,
		duration,
		queue,
		currentIndex: queueIndex,
		onTogglePlayPause: togglePlayPause,
		onPlayPrevious: playPrevious,
		onPlayNext: playNext,
		onSeekTo: seekTo,
		onSetVolume: setVolume,
		onRemoveFromQueue: removeSongFromQueue,
		onReorderQueue: reorderQueue,
	};

	return (
		<PlayerContainer
			isOfflineMode={isOfflineMode}
			audioElement={
				<audio ref={audioRef}>
					<track kind="captions" />
				</audio>
			}
		>
			<MobileLayout {...layoutProps} />
			<DesktopLayout {...layoutProps} />
		</PlayerContainer>
	);
}
