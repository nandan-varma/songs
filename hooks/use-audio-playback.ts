import { type RefObject, useEffect } from "react";
import type { DetailedSong } from "@/lib/types";

interface UseAudioPlaybackProps {
	currentSong: DetailedSong | null;
	audioRef: RefObject<HTMLAudioElement | null>;
	isPlaying: boolean;
}

/**
 * Manages audio element play/pause state synchronization
 */
export function useAudioPlayback({
	currentSong,
	audioRef,
	isPlaying,
}: UseAudioPlaybackProps) {
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !currentSong) return;

		if (isPlaying && audio.paused) {
			audio.play().catch(console.error);
		} else if (!isPlaying && !audio.paused) {
			audio.pause();
		}
	}, [isPlaying, currentSong, audioRef]);
}
