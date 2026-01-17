import { type RefObject, useEffect } from "react";
import type { DetailedSong } from "@/lib/types";

interface UseMediaSessionProps {
	currentSong: DetailedSong | null;
	audioRef: RefObject<HTMLAudioElement | null>;
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	playNext: () => void;
	playPrevious: () => void;
	seekTo: (time: number) => void;
}

/**
 * Manages Media Session API integration for system-level media controls
 */
export function useMediaSession({
	currentSong,
	audioRef,
	isPlaying,
	currentTime,
	duration,
	playNext,
	playPrevious,
	seekTo,
}: UseMediaSessionProps) {
	// Set up metadata when song changes
	useEffect(() => {
		if (!("mediaSession" in navigator) || !currentSong) {
			return;
		}

		const artwork =
			currentSong.image?.map((img) => ({
				src: img.url,
				sizes:
					img.quality === "500x500"
						? "500x500"
						: img.quality === "150x150"
							? "150x150"
							: "50x50",
				type: "image/jpeg",
			})) || [];

		navigator.mediaSession.metadata = new MediaMetadata({
			title: currentSong.name,
			artist:
				currentSong.artists?.primary?.map((a) => a.name).join(", ") ||
				"Unknown Artist",
			album: currentSong.album?.name || "Unknown Album",
			artwork: artwork.length > 0 ? artwork : undefined,
		});

		return () => {
			if ("mediaSession" in navigator) {
				navigator.mediaSession.metadata = null;
			}
		};
	}, [currentSong]);

	// Update playback state
	useEffect(() => {
		if (!("mediaSession" in navigator)) return;
		navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
	}, [isPlaying]);

	// Set up action handlers once
	useEffect(() => {
		if (!("mediaSession" in navigator)) return;

		const playHandler = () => {
			audioRef.current?.play().catch(console.error);
		};

		const pauseHandler = () => {
			audioRef.current?.pause();
		};

		const seektoHandler = (details: MediaSessionActionDetails) => {
			if (details.seekTime) {
				seekTo(details.seekTime);
			}
		};

		const seekbackwardHandler = (details: MediaSessionActionDetails) => {
			const skipTime = details.seekOffset || 10;
			const audio = audioRef.current;
			if (audio) {
				seekTo(Math.max(0, audio.currentTime - skipTime));
			}
		};

		const seekforwardHandler = (details: MediaSessionActionDetails) => {
			const skipTime = details.seekOffset || 10;
			const audio = audioRef.current;
			if (audio) {
				seekTo(Math.min(audio.duration || 0, audio.currentTime + skipTime));
			}
		};

		navigator.mediaSession.setActionHandler("play", playHandler);
		navigator.mediaSession.setActionHandler("pause", pauseHandler);
		navigator.mediaSession.setActionHandler("previoustrack", playPrevious);
		navigator.mediaSession.setActionHandler("nexttrack", playNext);
		navigator.mediaSession.setActionHandler("seekto", seektoHandler);
		navigator.mediaSession.setActionHandler(
			"seekbackward",
			seekbackwardHandler,
		);
		navigator.mediaSession.setActionHandler("seekforward", seekforwardHandler);

		return () => {
			if ("mediaSession" in navigator) {
				navigator.mediaSession.setActionHandler("play", null);
				navigator.mediaSession.setActionHandler("pause", null);
				navigator.mediaSession.setActionHandler("previoustrack", null);
				navigator.mediaSession.setActionHandler("nexttrack", null);
				navigator.mediaSession.setActionHandler("seekto", null);
				navigator.mediaSession.setActionHandler("seekbackward", null);
				navigator.mediaSession.setActionHandler("seekforward", null);
			}
		};
	}, [playNext, playPrevious, seekTo, audioRef]);

	// Update position state for scrubbing
	useEffect(() => {
		if (!("mediaSession" in navigator) || !audioRef.current || duration <= 0)
			return;

		navigator.mediaSession.setPositionState({
			duration: duration,
			playbackRate: audioRef.current.playbackRate || 1,
			position: currentTime,
		});
	}, [currentTime, duration, audioRef]);
}
