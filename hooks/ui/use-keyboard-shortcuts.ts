import { useCallback, useEffect, useRef } from "react";
import { usePlayer } from "@/hooks/use-store";
import { useAppStore } from "@/lib/store";

export function useKeyboardShortcuts() {
	const { currentTime, duration, volume } = usePlayer();

	// Store refs for time and volume to avoid stale closures
	const volumeRef = useRef(volume);
	const currentTimeRef = useRef(currentTime);
	const durationRef = useRef(duration);

	// Update refs when dependencies change
	useEffect(() => {
		volumeRef.current = volume;
	}, [volume]);

	useEffect(() => {
		currentTimeRef.current = currentTime;
	}, [currentTime]);

	useEffect(() => {
		durationRef.current = duration;
	}, [duration]);

	// Single memoized key handler that accesses store directly
	const handleKeyDown = useCallback((e: KeyboardEvent) => {
		if (
			e.target instanceof HTMLInputElement ||
			e.target instanceof HTMLTextAreaElement
		) {
			return;
		}

		// Access store state directly to avoid dependency array issues
		const state = useAppStore.getState();

		switch (e.code) {
			case "Space": {
				e.preventDefault();
				state.togglePlayPause();
				break;
			}
			case "ArrowRight": {
				if (e.shiftKey) {
					state.setSongTime(
						Math.min(durationRef.current, currentTimeRef.current + 10),
					);
				} else {
					state.setSongTime(
						Math.min(durationRef.current, currentTimeRef.current + 5),
					);
				}
				break;
			}
			case "ArrowLeft": {
				if (e.shiftKey) {
					state.setSongTime(Math.max(0, currentTimeRef.current - 10));
				} else {
					state.setSongTime(Math.max(0, currentTimeRef.current - 5));
				}
				break;
			}
			case "ArrowUp": {
				e.preventDefault();
				state.setVolume(Math.min(1, volumeRef.current + 0.1));
				break;
			}
			case "ArrowDown": {
				e.preventDefault();
				state.setVolume(Math.max(0, volumeRef.current - 0.1));
				break;
			}
			case "KeyM": {
				state.setVolume(volumeRef.current > 0 ? 0 : 0.5);
				break;
			}
			case "KeyN": {
				state.playNext();
				break;
			}
			case "KeyP": {
				state.playPrevious();
				break;
			}
		}
	}, []);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);
}
