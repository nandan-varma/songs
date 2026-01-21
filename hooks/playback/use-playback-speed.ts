import { useCallback, useState } from "react";

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export function usePlaybackSpeed() {
	const [speed, setSpeedState] = useState<PlaybackSpeed>(1);

	const cycleSpeed = useCallback(() => {
		setSpeedState((prev) => {
			const currentIndex = PLAYBACK_SPEEDS.indexOf(prev);
			const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
			return PLAYBACK_SPEEDS[nextIndex];
		});
	}, []);

	const setSpeed = useCallback((newSpeed: PlaybackSpeed) => {
		setSpeedState(newSpeed);
	}, []);

	return { speed, setSpeed, cycleSpeed, PLAYBACK_SPEEDS };
}
