import { useEffect, useRef } from "react";
import { logAudioError } from "@/lib/utils/audio-error";
import { SEEK_OFFSET_SECONDS, type UseMediaSessionProps } from "@/types/player";

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
	const actionHandlersRef = useRef<Set<string>>(new Set());

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

	useEffect(() => {
		if (!("mediaSession" in navigator)) return;
		navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
	}, [isPlaying]);

	useEffect(() => {
		if (!("mediaSession" in navigator)) return;

		const playHandler = () => {
			audioRef.current?.play().catch((error) => {
				logAudioError(error as MediaError, "MediaSessionPlay");
			});
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
			const skipTime = details.seekOffset || SEEK_OFFSET_SECONDS;
			const audio = audioRef.current;
			if (audio) {
				seekTo(Math.max(0, audio.currentTime - skipTime));
			}
		};

		const seekforwardHandler = (details: MediaSessionActionDetails) => {
			const skipTime = details.seekOffset || SEEK_OFFSET_SECONDS;
			const audio = audioRef.current;
			if (audio) {
				seekTo(Math.min(audio.duration || 0, audio.currentTime + skipTime));
			}
		};

		const actions = [
			{ name: "play", handler: playHandler },
			{ name: "pause", handler: pauseHandler },
			{ name: "previoustrack", handler: playPrevious },
			{ name: "nexttrack", handler: playNext },
			{ name: "seekto", handler: seektoHandler },
			{ name: "seekbackward", handler: seekbackwardHandler },
			{ name: "seekforward", handler: seekforwardHandler },
		] as const;

		for (const { name, handler } of actions) {
			navigator.mediaSession.setActionHandler(name, handler);
			actionHandlersRef.current.add(name);
		}

		return () => {
			if ("mediaSession" in navigator) {
				for (const { name } of actions) {
					if (actionHandlersRef.current.has(name)) {
						navigator.mediaSession.setActionHandler(name, null);
						actionHandlersRef.current.delete(name);
					}
				}
			}
		};
	}, [playNext, playPrevious, seekTo, audioRef]);

	useEffect(() => {
		if (!("mediaSession" in navigator) || !audioRef.current || duration <= 0) {
			return;
		}

		navigator.mediaSession.setPositionState({
			duration: duration,
			playbackRate: audioRef.current.playbackRate || 1,
			position: currentTime,
		});
	}, [currentTime, duration, audioRef]);
}
