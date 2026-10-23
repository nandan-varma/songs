import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import type { UseAudioSeekingProps } from "@/types/player";

/**
 * Synchronizes seeking between the Zustand store and the audio element.
 * Subscribes to the store directly so playback ticks never re-render the player.
 * - Updates audio.currentTime when the store time jumps (a seek)
 * - Captures throttled timeupdate events into the store
 */
export function useAudioSeeking({
	audioRef,
	currentSong,
}: UseAudioSeekingProps) {
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !currentSong) return;

		return useAppStore.subscribe((state, previous) => {
			if (state.currentTime === previous.currentTime) return;
			// Ticks from the audio element land within a few ms; larger gaps are user seeks.
			if (Math.abs(audio.currentTime - state.currentTime) > 0.1) {
				audio.currentTime = state.currentTime;
			}
		});
	}, [currentSong, audioRef]);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		let lastUpdate = 0;
		const throttleMs = 100;

		const handleTimeUpdate = () => {
			const now = performance.now();
			if (now - lastUpdate >= throttleMs) {
				lastUpdate = now;
				useAppStore.getState().setSongTime(audio.currentTime);
			}
		};

		const handleDurationChange = () => {
			const duration = audio.duration;
			if (!Number.isNaN(duration) && Number.isFinite(duration)) {
				useAppStore.getState().setSongDuration(duration);
			}
		};

		const handleEnded = () => {
			useAppStore.getState().playNext();
		};

		audio.addEventListener("timeupdate", handleTimeUpdate);
		audio.addEventListener("durationchange", handleDurationChange);
		audio.addEventListener("ended", handleEnded);

		if (audio.duration > 0) {
			handleDurationChange();
		}

		return () => {
			audio.removeEventListener("timeupdate", handleTimeUpdate);
			audio.removeEventListener("durationchange", handleDurationChange);
			audio.removeEventListener("ended", handleEnded);
		};
	}, [audioRef]);
}
