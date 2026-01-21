import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayerActions } from "@/contexts/player-context";

const SLEEP_TIMER_PRESETS = [5, 10, 15, 30, 45, 60, 90] as const;

export type SleepTimerPreset = (typeof SLEEP_TIMER_PRESETS)[number];

export function useSleepTimer() {
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
	const [isActive, setIsActive] = useState(false);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const endTimeRef = useRef<number | null>(null);
	const { togglePlayPause } = usePlayerActions();

	const stopTimer = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		endTimeRef.current = null;
		setTimeRemaining(null);
		setIsActive(false);
	}, []);

	const startTimer = useCallback(
		(minutes: SleepTimerPreset) => {
			stopTimer();
			const duration = minutes * 60 * 1000;
			const endTime = Date.now() + duration;
			endTimeRef.current = endTime;
			setIsActive(true);

			const updateTime = () => {
				if (endTimeRef.current === null) return;

				const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
				if (remaining <= 0) {
					stopTimer();
					togglePlayPause();
				} else {
					setTimeRemaining(remaining);
				}
			};

			updateTime();
			timerRef.current = setInterval(updateTime, 1000);
		},
		[togglePlayPause, stopTimer],
	);

	const cancelTimer = useCallback(() => {
		stopTimer();
	}, [stopTimer]);

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, []);

	return {
		timeRemaining,
		isActive,
		startTimer,
		stopTimer,
		cancelTimer,
		presets: SLEEP_TIMER_PRESETS,
	};
}
