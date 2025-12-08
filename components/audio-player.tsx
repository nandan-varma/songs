"use client";

import NextImage from "next/image";
import { WifiOff } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useDownloadsActions } from "@/contexts/downloads-context";
import { useOffline } from "@/contexts/offline-context";
import {
	usePlayback,
	usePlayerActions,
	useQueue,
} from "@/contexts/player-context";
import { PlaybackControls } from "./player/playback-controls";
import { ProgressBar } from "./player/progress-bar";
import { QueueButton } from "./player/queue-button";
import { SongInfo } from "./player/song-info";
import { VolumeControl } from "./player/volume-control";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

/**
 * Persistent audio player UI with split contexts to minimize re-renders
 */
export function AudioPlayer() {
	const { currentSong, isPlaying, volume, currentTime, duration, audioRef } =
		usePlayback();
	const { queue, currentIndex } = useQueue();
	const {
		togglePlayPause,
		playNext,
		playPrevious,
		seekTo,
		setVolume,
		removeFromQueue,
	} = usePlayerActions();
	const { getSongBlob, isSongCached } = useDownloadsActions();
	const { isOfflineMode } = useOffline();

	// Store the current song ID to detect actual song changes
	const previousSongIdRef = useRef<string | null>(null);

	/** Skip uncached songs in offline mode */
	useEffect(() => {
		if (!currentSong || !isOfflineMode) return;

		if (!isSongCached(currentSong.id)) {
			toast.error(
				`"${currentSong.name}" is not available offline. Skipping...`,
			);
			// Clear the audio source to prevent playing wrong content
			if (audioRef.current) {
				audioRef.current.src = "";
				audioRef.current.load();
			}
			playNext();
		}
	}, [currentSong, isOfflineMode, isSongCached, playNext, audioRef]);

	/** Manages audio source loading - only when song actually changes */
	useEffect(() => {
		if (!currentSong || !audioRef.current) {
			previousSongIdRef.current = null;
			return;
		}

		// Only load new source if the song ID actually changed
		if (previousSongIdRef.current === currentSong.id) {
			return;
		}

		previousSongIdRef.current = currentSong.id;
		const audio = audioRef.current;
		let blobUrl: string | null = null;

		// Try to use cached audio first, then fallback to remote URL
		const cachedBlob = getSongBlob(currentSong.id);
		if (cachedBlob) {
			blobUrl = URL.createObjectURL(cachedBlob);
			audio.src = blobUrl;
		} else {
			// In offline mode, don't try to play remote URLs
			if (isOfflineMode) return;

			const downloadUrl =
				currentSong.downloadUrl?.find((url) => url.quality === "320kbps") ||
				currentSong.downloadUrl?.[currentSong.downloadUrl.length - 1];

			if (!downloadUrl?.url) return;
			audio.src = downloadUrl.url;
		}

		// Load the new source
		audio.load();

		// If we should be playing, start playback when ready
		if (isPlaying) {
			const playWhenReady = () => {
				audio.play().catch(console.error);
				audio.removeEventListener("canplay", playWhenReady);
			};
			audio.addEventListener("canplay", playWhenReady);
		}

		// Cleanup: revoke blob URL when song changes or component unmounts
		return () => {
			if (blobUrl) {
				URL.revokeObjectURL(blobUrl);
			}
		};
	}, [currentSong, audioRef, isOfflineMode, isPlaying, getSongBlob]);

	/** Manages play/pause state */
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !currentSong) return;

		if (isPlaying && audio.paused) {
			audio.play().catch(console.error);
		} else if (!isPlaying && !audio.paused) {
			audio.pause();
		}
	}, [isPlaying, currentSong, audioRef]);

	/** Set up Media Session API metadata - only when song changes */
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

	/** Update Media Session playback state */
	useEffect(() => {
		if (!("mediaSession" in navigator)) return;
		navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
	}, [isPlaying]);

	/** Set up Media Session action handlers once */
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

	/** Update Media Session position state for scrubbing */
	useEffect(() => {
		if (!("mediaSession" in navigator) || !audioRef.current || duration <= 0)
			return;

		navigator.mediaSession.setPositionState({
			duration: duration,
			playbackRate: audioRef.current.playbackRate || 1,
			position: currentTime,
		});
	}, [currentTime, duration, audioRef]);

	if (!currentSong) {
		return null;
	}

	return (
		<div className="fixed bottom-6 left-4 right-4 md:left-6 md:right-6 z-50 max-w-7xl mx-auto">
			<Card className="bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/90 border shadow-2xl">
				<audio ref={audioRef}>
					<track kind="captions" />
				</audio>

				{isOfflineMode && (
					<div className="absolute -top-2 right-4 z-10">
						<Badge
							variant="secondary"
							className="flex items-center gap-1 bg-orange-500/90 text-white border-orange-600"
						>
							<WifiOff className="h-3 w-3" />
							Offline Mode
						</Badge>
					</div>
				)}

				<div className="px-4 md:px-6 py-4 md:py-5">
					{/* Mobile Layout */}
					<div className="md:hidden space-y-4">
						<div className="flex items-start gap-3">
							{currentSong.image && currentSong.image.length > 0 && (
								<div className="relative h-16 w-16 flex-shrink-0">
									<NextImage
										src={currentSong.image[2]?.url || ""}
										alt={currentSong.name}
										width={64}
										height={64}
										className="h-full w-full object-cover rounded"
									/>
								</div>
							)}

							<div className="min-w-0 flex-1">
								<h3 className="font-semibold truncate text-base">
									{currentSong.name}
								</h3>
								<div className="text-sm text-muted-foreground truncate">
									{currentSong.artists?.primary?.map((artist, index) => (
										<span key={artist.id}>
											{artist.name}
											{index < currentSong.artists.primary.length - 1 && ", "}
										</span>
									))}
								</div>
							</div>

							<QueueButton
								queue={queue}
								currentIndex={currentIndex}
								onRemoveFromQueue={removeFromQueue}
							/>
						</div>

						<ProgressBar
							currentTime={currentTime}
							duration={duration}
							onSeekTo={seekTo}
						/>

						<div className="flex items-center justify-between">
							<PlaybackControls
								isPlaying={isPlaying}
								queueLength={queue.length}
								onTogglePlayPause={togglePlayPause}
								onPlayPrevious={playPrevious}
								onPlayNext={playNext}
							/>

							<VolumeControl volume={volume} onSetVolume={setVolume} />
						</div>
					</div>

					{/* Desktop Layout */}
					<div className="hidden md:flex items-center gap-6">
						<SongInfo currentSong={currentSong} />

						<div className="flex flex-col items-center gap-3 flex-1 max-w-2xl">
							<PlaybackControls
								isPlaying={isPlaying}
								queueLength={queue.length}
								onTogglePlayPause={togglePlayPause}
								onPlayPrevious={playPrevious}
								onPlayNext={playNext}
							/>

							<ProgressBar
								currentTime={currentTime}
								duration={duration}
								onSeekTo={seekTo}
							/>
						</div>

						<div className="flex items-center gap-3 w-72 justify-end">
							<VolumeControl volume={volume} onSetVolume={setVolume} />
							<QueueButton
								queue={queue}
								currentIndex={currentIndex}
								onRemoveFromQueue={removeFromQueue}
							/>
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
}
