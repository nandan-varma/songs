"use client";

import { useCallback, useRef } from "react";
import { useAudioPlayback } from "@/hooks/audio/use-audio-playback";
import { useAudioSeeking } from "@/hooks/audio/use-audio-seeking";
import { useAudioSettings } from "@/hooks/audio/use-audio-settings";
import { useAudioSource } from "@/hooks/audio/use-audio-source";
import { useMediaSession } from "@/hooks/audio/use-media-session";
import { useIsOffline } from "@/hooks/network/use-is-offline";
import { useOfflineSkip } from "@/hooks/player/use-offline-skip";
import {
	useCurrentSong,
	useCurrentTime,
	useDuration,
	useIsMuted,
	useIsPlaying,
	usePlaybackSpeedValue,
	useQueueIndex,
	useQueueSongs,
	useVolume,
} from "@/hooks/use-store";
import { getDownloadedSongBlob } from "@/lib/downloads/storage";
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
	const playbackSpeed = usePlaybackSpeedValue();
	const isMuted = useIsMuted();
	const currentTime = useCurrentTime();
	const duration = useDuration();
	const queue = useQueueSongs();
	const queueIndex = useQueueIndex();
	const downloadedSongIds = useAppStore((state) => state.downloadedSongIds);

	const audioRef = useRef<HTMLAudioElement>(null);

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

	const isOffline = useIsOffline();

	useOfflineSkip({
		currentSong,
		isOffline,
		isSongCached: (songId) => downloadedSongIds.has(songId),
		playNext,
	});
	useAudioSource({
		currentSong,
		audioRef,
		isOffline,
		getSongBlob: getDownloadedSongBlob,
	});
	useAudioSettings({ audioRef, volume, playbackSpeed, isMuted });
	useAudioPlayback({ currentSong, audioRef, isPlaying });
	useAudioSeeking({ audioRef, currentSong });
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
			isOffline={isOffline}
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
