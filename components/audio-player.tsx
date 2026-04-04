"use client";

import { useCallback, useRef } from "react";
import { useAudioPlayback } from "@/hooks/audio/use-audio-playback";
import { useAudioSource } from "@/hooks/audio/use-audio-source";
import { useMediaSession } from "@/hooks/audio/use-media-session";
import { useOfflineSkip } from "@/hooks/player/use-offline-skip";
import {
	useCurrentSong,
	useCurrentTime,
	useDuration,
	useIsOfflineMode,
	useIsPlaying,
	useQueue_List,
	useQueueIndex,
	useVolume,
} from "@/hooks/use-store";
import { useAppStore } from "@/lib/store";
import { DesktopLayout } from "./player/desktop-layout";
import { MobileLayout } from "./player/mobile-layout";
import { PlayerContainer } from "./player/player-container";

/**
 * Persistent audio player UI with Zustand store to minimize re-renders
 */
export function AudioPlayer() {
	const currentSong = useCurrentSong();
	const isPlaying = useIsPlaying();
	const volume = useVolume();
	const currentTime = useCurrentTime();
	const duration = useDuration();
	const queue = useQueue_List();
	const queueIndex = useQueueIndex();

	// Create stable audio ref that persists across renders
	const audioRef = useRef<HTMLAudioElement>(null);

	// Access store actions directly without creating new objects
	const togglePlayPause = useCallback(() => {
		useAppStore.getState().togglePlayPause();
	}, []);

	const playNext = useCallback(() => {
		useAppStore.getState().playNext();
	}, []);

	const playPrevious = useCallback(() => {
		useAppStore.getState().playPrevious();
	}, []);

	const seekTo = useCallback((time: number) => {
		useAppStore.getState().setSongTime(time);
	}, []);

	const setVolume_ = useCallback((vol: number) => {
		useAppStore.getState().setVolume(vol);
	}, []);

	const removeSongFromQueue = useCallback((index: number) => {
		useAppStore.getState().removeSongFromQueue(index);
	}, []);

	const reorderQueue = useCallback((from: number, to: number) => {
		useAppStore.getState().reorderQueue(from, to);
	}, []);

	const isOfflineMode = useIsOfflineMode();

	// Wrapper to convert async isSongCached to sync for useOfflineSkip
	const isSongCachedSync = useCallback((_songId: string): boolean => {
		return false;
	}, []);

	// Create a mock getSongBlob function for useAudioSource
	const getSongBlob = useCallback(
		async (_songId: string): Promise<Blob | null> => {
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
		onSetVolume: setVolume_,
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
