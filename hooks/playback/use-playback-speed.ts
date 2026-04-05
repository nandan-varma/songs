import { useCallback } from "react";
import { usePlaybackSpeedValue } from "@/hooks/use-store";
import { useAppStore } from "@/lib/store";

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export function usePlaybackSpeed() {
	const speed = usePlaybackSpeedValue() as PlaybackSpeed;

	const cycleSpeed = useCallback(() => {
		const currentIndex = PLAYBACK_SPEEDS.indexOf(speed);
		const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
		const nextSpeed = PLAYBACK_SPEEDS[nextIndex] ?? 1;
		useAppStore.getState().setPlaybackSpeed(nextSpeed);
	}, [speed]);

	const setSpeed = useCallback((newSpeed: PlaybackSpeed) => {
		useAppStore.getState().setPlaybackSpeed(newSpeed);
	}, []);

	return { speed, setSpeed, cycleSpeed, PLAYBACK_SPEEDS };
}
