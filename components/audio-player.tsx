"use client";

import { useEffect, useRef, useState } from "react";
import { useAudioPlayback } from "@/hooks/audio/use-audio-playback";
import { useAudioSource } from "@/hooks/audio/use-audio-source";
import { useMediaSession } from "@/hooks/audio/use-media-session";
import { useOfflineSkip } from "@/hooks/player/use-offline-skip";
import { useDownloadsActions } from "@/stores/downloads-store";
import { useOfflineStore } from "@/stores/offline-store";
import {
	usePlaybackState,
	usePlayerActions,
	usePlayerStore,
	useQueueState,
} from "@/stores/player-store";
import { DesktopLayout } from "./player/desktop-layout";
import { MobileLayout } from "./player/mobile-layout";
import { PlayerContainer } from "./player/player-container";

/**
 * Persistent audio player UI with Zustand stores for state management
 */
export function AudioPlayer() {
	const [mounted, setMounted] = useState(false);
	const audioRef = useRef<HTMLAudioElement>(null);
	const setAudioRef = usePlayerStore((state) => state.setAudioRef);
	const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
	const setDuration = usePlayerStore((state) => state.setDuration);
	const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
	const setIsLoading = usePlayerStore((state) => state.setIsLoading);

	const { currentSong, isPlaying, isLoading, volume, currentTime, duration } =
		usePlaybackState();
	const { queue, currentIndex } = useQueueState();
	const {
		togglePlayPause,
		playNext,
		playPrevious,
		seekTo,
		setVolume,
		removeSong,
		reorderQueue,
	} = usePlayerActions();
	const { getSongBlob, isSongCached } = useDownloadsActions();
	const isOnline = useOfflineStore((state) => state.isOnline);

	useEffect(() => {
		setMounted(true);
	}, []);

	const isOfflineMode = !isOnline;

	// Set audio ref on mount
	useEffect(() => {
		if (audioRef.current) {
			setAudioRef(audioRef as React.RefObject<HTMLAudioElement>);
		}
	}, [setAudioRef]);

	// Audio event listeners
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
		const handleDurationChange = () => setDuration(audio.duration);
		const handleEnded = () => playNext();
		const handlePlay = () => {
			setIsPlaying(true);
			setIsLoading(false);
		};
		const handlePause = () => setIsPlaying(false);
		const handleWaiting = () => setIsLoading(true);
		const handleCanPlay = () => setIsLoading(false);
		const handleLoadStart = () => setIsLoading(true);
		const handleError = () => {
			setIsPlaying(false);
			setIsLoading(false);
			setCurrentTime(0);
			setDuration(0);
		};

		audio.addEventListener("timeupdate", handleTimeUpdate);
		audio.addEventListener("durationchange", handleDurationChange);
		audio.addEventListener("ended", handleEnded);
		audio.addEventListener("play", handlePlay);
		audio.addEventListener("pause", handlePause);
		audio.addEventListener("waiting", handleWaiting);
		audio.addEventListener("canplay", handleCanPlay);
		audio.addEventListener("loadstart", handleLoadStart);
		audio.addEventListener("error", handleError);

		return () => {
			audio.removeEventListener("timeupdate", handleTimeUpdate);
			audio.removeEventListener("durationchange", handleDurationChange);
			audio.removeEventListener("ended", handleEnded);
			audio.removeEventListener("play", handlePlay);
			audio.removeEventListener("pause", handlePause);
			audio.removeEventListener("waiting", handleWaiting);
			audio.removeEventListener("canplay", handleCanPlay);
			audio.removeEventListener("loadstart", handleLoadStart);
			audio.removeEventListener("error", handleError);
		};
	}, [playNext, setCurrentTime, setDuration, setIsPlaying, setIsLoading]);

	// Audio management hooks - each with single responsibility
	useOfflineSkip({ currentSong, isOfflineMode, isSongCached, playNext });
	useAudioSource({
		currentSong,
		audioRef,
		isOfflineMode,
		getSongBlob,
	});
	useAudioPlayback({ currentSong, audioRef });
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
		isLoading: hasCurrentSong && isLoading,
		volume,
		currentTime,
		duration,
		queue,
		currentIndex,
		onTogglePlayPause: togglePlayPause,
		onPlayPrevious: playPrevious,
		onPlayNext: playNext,
		onSeekTo: seekTo,
		onSetVolume: setVolume,
		onRemoveFromQueue: removeSong,
		onReorderQueue: reorderQueue,
	};

	return (
		<PlayerContainer
			isOfflineMode={mounted ? isOfflineMode : false}
			audioElement={
				<audio ref={audioRef} suppressHydrationWarning>
					<track kind="captions" />
				</audio>
			}
		>
			<div suppressHydrationWarning>
				<MobileLayout {...layoutProps} />
				<DesktopLayout {...layoutProps} />
			</div>
		</PlayerContainer>
	);
}
