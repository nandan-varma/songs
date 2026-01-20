import { type RefObject, useEffect, useRef } from "react";
import type { DetailedSong } from "@/lib/types";

interface UseAudioPlaybackProps {
	currentSong: DetailedSong | null;
	audioRef: RefObject<HTMLAudioElement | null>;
	isPlaying: boolean;
}

/**
 * Manages audio element play/pause state synchronization
 * Handles iOS audio autoplay restrictions by waiting for canplay event
 */
export function useAudioPlayback({
	currentSong,
	audioRef,
	isPlaying,
}: UseAudioPlaybackProps) {
	const currentSongIdRef = useRef<string | null>(null);
	const canPlayHandlerRef = useRef<(() => void) | null>(null);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !currentSong) return;

		if (canPlayHandlerRef.current) {
			audio.removeEventListener("canplay", canPlayHandlerRef.current);
			canPlayHandlerRef.current = null;
		}
	}, [audioRef, currentSong]);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !currentSong) return;

		const songChanged = currentSongIdRef.current !== currentSong.id;
		currentSongIdRef.current = currentSong.id;

		if (songChanged && isPlaying) {
			const handleCanPlay = () => {
				if (currentSongIdRef.current === currentSong.id) {
					audio.play().catch(() => {});
				}
				audio.removeEventListener("canplay", handleCanPlay);
				canPlayHandlerRef.current = null;
			};

			canPlayHandlerRef.current = handleCanPlay;
			audio.addEventListener("canplay", handleCanPlay);

			if (audio.readyState >= 3) {
				audio.removeEventListener("canplay", handleCanPlay);
				canPlayHandlerRef.current = null;
				audio.play().catch(() => {});
			}
		}
	}, [currentSong, audioRef, isPlaying]);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !currentSong) return;

		if (currentSongIdRef.current !== currentSong.id) return;

		if (isPlaying) {
			if (audio.paused) {
				if (audio.readyState >= 3) {
					audio.play().catch(() => {});
				} else {
					if (!canPlayHandlerRef.current) {
						const handleCanPlay = () => {
							if (isPlaying && audio.paused) {
								audio.play().catch(() => {});
							}
							audio.removeEventListener("canplay", handleCanPlay);
							canPlayHandlerRef.current = null;
						};
						canPlayHandlerRef.current = handleCanPlay;
						audio.addEventListener("canplay", handleCanPlay);
					}
				}
			}
		} else {
			if (!audio.paused) {
				audio.pause();
			}
		}
	}, [isPlaying, currentSong, audioRef]);
}
