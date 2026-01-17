"use client";

import { useDownloadsActions } from "@/contexts/downloads-context";
import { useOffline } from "@/contexts/offline-context";
import {
	usePlayback,
	usePlayerActions,
	useQueue,
} from "@/contexts/player-context";
import { useAudioPlayback } from "@/hooks/use-audio-playback";
import { useAudioSource } from "@/hooks/use-audio-source";
import { useMediaSession } from "@/hooks/use-media-session";
import { useOfflineSkip } from "@/hooks/use-offline-skip";
import { DesktopLayout } from "./player/desktop-layout";
import { MobileLayout } from "./player/mobile-layout";
import { PlayerContainer } from "./player/player-container";

/**
 * Persistent audio player UI with split contexts to minimize re-renders
 */
export function AudioPlayer() {
	const { currentSong, isPlaying, volume, currentTime, duration, audioRef } =
		usePlayback();
	const { queue, currentIndex } = useQueue();
	const {
		togglePlayPause,
		playNext,
		playPrevious,
		seekTo,
		setVolume,
		removeFromQueue,
		reorderQueue,
	} = usePlayerActions();
	const { getSongBlob, isSongCached } = useDownloadsActions();
	const { isOfflineMode } = useOffline();

	// Audio management hooks - each with single responsibility
	useOfflineSkip({ currentSong, isOfflineMode, isSongCached, playNext });
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

	if (!currentSong) {
		return null;
	}

	const layoutProps = {
		currentSong,
		isPlaying,
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
		onRemoveFromQueue: removeFromQueue,
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
