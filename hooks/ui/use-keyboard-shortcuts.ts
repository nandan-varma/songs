import { useEffect, useRef } from "react";
import { usePlayer } from "@/contexts/player-context";

export function useKeyboardShortcuts() {
	const {
		togglePlayPause,
		playNext,
		playPrevious,
		seekTo,
		setVolume,
		currentTime,
		duration,
		volume,
	} = usePlayer();

	const volumeRef = useRef(volume);
	const currentTimeRef = useRef(currentTime);
	const durationRef = useRef(duration);

	useEffect(() => {
		volumeRef.current = volume;
	}, [volume]);

	useEffect(() => {
		currentTimeRef.current = currentTime;
	}, [currentTime]);

	useEffect(() => {
		durationRef.current = duration;
	}, [duration]);

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			switch (e.code) {
				case "Space": {
					e.preventDefault();
					togglePlayPause();
					break;
				}
				case "ArrowRight": {
					if (e.shiftKey) {
						seekTo(Math.min(durationRef.current, currentTimeRef.current + 10));
					} else {
						seekTo(Math.min(durationRef.current, currentTimeRef.current + 5));
					}
					break;
				}
				case "ArrowLeft": {
					if (e.shiftKey) {
						seekTo(Math.max(0, currentTimeRef.current - 10));
					} else {
						seekTo(Math.max(0, currentTimeRef.current - 5));
					}
					break;
				}
				case "ArrowUp": {
					e.preventDefault();
					setVolume(Math.min(1, volumeRef.current + 0.1));
					break;
				}
				case "ArrowDown": {
					e.preventDefault();
					setVolume(Math.max(0, volumeRef.current - 0.1));
					break;
				}
				case "KeyM": {
					setVolume(volumeRef.current > 0 ? 0 : 0.5);
					break;
				}
				case "KeyN": {
					playNext();
					break;
				}
				case "KeyP": {
					playPrevious();
					break;
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [togglePlayPause, playNext, playPrevious, seekTo, setVolume]);
}
