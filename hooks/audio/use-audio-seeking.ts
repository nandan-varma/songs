"use client";

import { useEffect } from "react";
import { useCurrentTime } from "@/hooks/use-store";
import { useAppStore } from "@/lib/store";
import type { UseAudioSeekingProps } from "@/types/player";

/**
 * Synchronizes seeking between the Zustand store and the audio element
 * - Updates audio.currentTime when store currentTime changes (seeking)
 * - Captures timeupdate events and updates store
 */
export function useAudioSeeking({
	audioRef,
	currentSong,
}: UseAudioSeekingProps) {
	const currentTime = useCurrentTime();

	// Sync store currentTime to audio element (for seeking)
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !currentSong) return;

		// Only update if it's different to avoid redundant updates
		if (Math.abs(audio.currentTime - currentTime) > 0.1) {
			audio.currentTime = currentTime;
		}
	}, [currentTime, currentSong, audioRef]);

	// Capture timeupdate events and update store
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		let lastUpdate = 0;
		const throttleMs = 100; // Update store every 100ms

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

		// Trigger durationchange if duration is already available
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
