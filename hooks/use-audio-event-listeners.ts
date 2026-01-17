import { type RefObject, useEffect, useRef } from "react";

const AUDIO_CHECK_INTERVAL_MS = 100;

interface AudioEventHandlers {
	onTimeUpdate: (currentTime: number) => void;
	onDurationChange: (duration: number) => void;
	onEnded: () => void;
	onPlay: () => void;
	onPause: () => void;
	onError: () => void;
}

/**
 * Sets up HTML5 audio element event listeners
 * Polls for audio element existence and manages cleanup
 */
export function useAudioEventListeners(
	audioRef: RefObject<HTMLAudioElement | null>,
	handlers: AudioEventHandlers,
) {
	const handlersRef = useRef(handlers);

	useEffect(() => {
		handlersRef.current = handlers;
	}, [handlers]);

	useEffect(() => {
		let cleanup: (() => void) | null = null;
		let checkInterval: NodeJS.Timeout | null = null;
		let isActive = true;

		const setupListeners = () => {
			if (!isActive) return false;

			const audio = audioRef.current;
			if (!audio) return false;

			const handleTimeUpdate = () => {
				if (isActive) handlersRef.current.onTimeUpdate(audio.currentTime);
			};
			const handleDurationChange = () => {
				if (isActive) handlersRef.current.onDurationChange(audio.duration || 0);
			};
			const handleEnded = () => {
				if (isActive) handlersRef.current.onEnded();
			};
			const handlePlay = () => {
				if (isActive) handlersRef.current.onPlay();
			};
			const handlePause = () => {
				if (isActive) handlersRef.current.onPause();
			};
			const handleError = () => {
				if (isActive) handlersRef.current.onError();
			};

			audio.addEventListener("timeupdate", handleTimeUpdate);
			audio.addEventListener("durationchange", handleDurationChange);
			audio.addEventListener("ended", handleEnded);
			audio.addEventListener("play", handlePlay);
			audio.addEventListener("pause", handlePause);
			audio.addEventListener("error", handleError);

			cleanup = () => {
				audio.removeEventListener("timeupdate", handleTimeUpdate);
				audio.removeEventListener("durationchange", handleDurationChange);
				audio.removeEventListener("ended", handleEnded);
				audio.removeEventListener("play", handlePlay);
				audio.removeEventListener("pause", handlePause);
				audio.removeEventListener("error", handleError);
			};

			return true;
		};

		// Try to setup listeners immediately
		if (!setupListeners()) {
			// If audio element not ready, poll for it
			checkInterval = setInterval(() => {
				if (setupListeners() && checkInterval) {
					clearInterval(checkInterval);
					checkInterval = null;
				}
			}, AUDIO_CHECK_INTERVAL_MS);
		}

		return () => {
			isActive = false;
			if (cleanup) {
				cleanup();
			}
			if (checkInterval) {
				clearInterval(checkInterval);
			}
		};
	}, [audioRef]);
}
