import { type RefObject, useEffect, useRef } from "react";
import type { DetailedSong } from "@/lib/types";

interface UseAudioPlaybackProps {
	currentSong: DetailedSong | null;
	audioRef: RefObject<HTMLAudioElement | null>;
	isPlaying: boolean;
}

/**
 * Manages audio element play/pause state synchronization
 * Waits for audio to be loaded before attempting playback to prevent race conditions
 */
export function useAudioPlayback({
	currentSong,
	audioRef,
	isPlaying,
}: UseAudioPlaybackProps) {
	const currentSongIdRef = useRef<string | null>(null);

	// Handle song changes and initial load
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !currentSong) return;

		const songChanged = currentSongIdRef.current !== currentSong.id;
		currentSongIdRef.current = currentSong.id;

		if (songChanged && isPlaying) {
			// Wait for audio to be loaded before playing
			const handleCanPlay = () => {
				if (currentSongIdRef.current === currentSong.id && isPlaying) {
					audio.play().catch(console.error);
				}
				audio.removeEventListener("canplay", handleCanPlay);
			};

			audio.addEventListener("canplay", handleCanPlay);

			// If already ready, play immediately
			if (audio.readyState >= 3) {
				// HAVE_FUTURE_DATA or higher
				handleCanPlay();
			}

			return () => {
				audio.removeEventListener("canplay", handleCanPlay);
			};
		}
	}, [currentSong, audioRef, isPlaying]);

	// Handle play/pause toggle for current song
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !currentSong) return;

		// Only handle play/pause if song hasn't changed
		if (currentSongIdRef.current !== currentSong.id) return;

		if (isPlaying && audio.paused) {
			// Only play if audio is ready
			if (audio.readyState >= 3) {
				audio.play().catch(console.error);
			}
		} else if (!isPlaying && !audio.paused) {
			audio.pause();
		}
	}, [isPlaying, currentSong, audioRef]);
}
