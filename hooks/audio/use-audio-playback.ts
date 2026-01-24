import { useEffect, useRef } from "react";
import { logAudioError } from "@/lib/utils/audio-error";
import type { UseAudioPlaybackProps } from "@/types/player";

/**
 * Manages audio element play/pause state synchronization
 *
 * Key principle: Let audio element events drive the isPlaying state
 *
 * Auto-play behavior:
 * - ALWAYS auto-play when song changes (user clicked play button)
 * - User can pause, but new song selections always start playing
 */
export function useAudioPlayback({
	currentSong,
	audioRef,
}: UseAudioPlaybackProps) {
	const previousSongIdRef = useRef<string | null>(null);
	const playAttemptedRef = useRef(false);

	// When song changes, always auto-play
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !currentSong) {
			previousSongIdRef.current = null;
			playAttemptedRef.current = false;
			return;
		}

		const songChanged = previousSongIdRef.current !== currentSong.id;
		previousSongIdRef.current = currentSong.id;

		if (songChanged) {
			playAttemptedRef.current = false;

			// Auto-play new songs (changing song = user intent to play)
			const attemptPlay = () => {
				if (audio.readyState >= 2 && !playAttemptedRef.current) {
					playAttemptedRef.current = true;
					audio.play().catch((error) => {
						logAudioError(error as MediaError, "AudioPlayback:SongChange");
					});
				}
			};

			// Try immediately if ready
			attemptPlay();

			// Otherwise wait for canplay
			if (audio.readyState < 2) {
				const handleCanPlay = () => {
					attemptPlay();
					audio.removeEventListener("canplay", handleCanPlay);
				};
				audio.addEventListener("canplay", handleCanPlay);

				return () => {
					audio.removeEventListener("canplay", handleCanPlay);
				};
			}
		}
	}, [currentSong, audioRef]);
}
