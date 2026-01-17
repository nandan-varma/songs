"use client";

import { WifiOff } from "lucide-react";
import { useDownloadsActions } from "@/contexts/downloads-context";
import { useOffline } from "@/contexts/offline-context";
import {
	usePlayback,
	usePlayerActions,
	useQueue,
} from "@/contexts/player-context";
import { useAudioPlayback } from "@/hooks/use-audio-playback";
import { useAudioSource } from "@/hooks/use-audio-source";
import { useMediaSession } from "@/hooks/use-media-session";
import { useOfflineSkip } from "@/hooks/use-offline-skip";
import { PlaybackControls } from "./player/playback-controls";
import { ProgressBar } from "./player/progress-bar";
import { QueueButton } from "./player/queue-button";
import { SongInfo } from "./player/song-info";
import { VolumeControl } from "./player/volume-control";
import { ProgressiveImage } from "./progressive-image";
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
		reorderQueue,
	} = usePlayerActions();
	const { getSongBlob, isSongCached } = useDownloadsActions();
	const { isOfflineMode } = useOffline();

	// Audio management hooks - each with single responsibility
	useOfflineSkip({ currentSong, isOfflineMode, isSongCached, playNext });
	useAudioSource({
		currentSong,
		audioRef,
		isOfflineMode,
		isPlaying,
		getSongBlob,
	});
	useAudioPlayback({ currentSong, audioRef, isPlaying });
	useMediaSession({
		currentSong,
		audioRef,
		isPlaying,
		currentTime,
		duration,
		playNext,
		playPrevious,
		seekTo,
	});

	if (!currentSong) {
		return null;
	}

	return (
		<div className="fixed bottom-6 left-4 right-4 md:left-6 md:right-6 z-50 max-w-7xl mx-auto">
			<Card className="bg-background/95 backdrop-blur-xl supports-backdrop-filter:bg-background/90 border shadow-2xl">
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
								<div className="relative h-16 w-16 shrink-0">
									<ProgressiveImage
										images={currentSong.image}
										alt={currentSong.name}
										rounded="default"
										priority
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
								onReorderQueue={reorderQueue}
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
								onReorderQueue={reorderQueue}
							/>
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
}
