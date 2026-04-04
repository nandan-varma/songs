"use client";

import { memo } from "react";
import { ProgressiveImage } from "@/components/common/progressive-image";
import type { DetailedSong } from "@/types/entity";
import { PlaybackControls } from "./playback-controls";
import { ProgressBar } from "./progress-bar";
import { QueueButton } from "./queue-button";
import { VolumeControl } from "./volume-control";

interface MobileLayoutProps {
	currentSong: DetailedSong | null;
	isPlaying: boolean;
	volume: number;
	currentTime: number;
	duration: number;
	queue: DetailedSong[];
	currentIndex: number;
	onTogglePlayPause: () => void;
	onPlayPrevious: () => void;
	onPlayNext: () => void;
	onSeekTo: (time: number) => void;
	onSetVolume: (volume: number) => void;
	onRemoveFromQueue: (index: number) => void;
	onReorderQueue: (fromIndex: number, toIndex: number) => void;
}

/**
 * Mobile-optimized player layout
 * - Touch-friendly button sizing (min 44-48px)
 * - Responsive spacing for readability
 * - Single responsibility: Mobile UI composition
 */
export const MobileLayout = memo(function MobileLayout({
	currentSong,
	isPlaying,
	volume,
	currentTime,
	duration,
	queue,
	currentIndex,
	onTogglePlayPause,
	onPlayPrevious,
	onPlayNext,
	onSeekTo,
	onSetVolume,
	onRemoveFromQueue,
	onReorderQueue,
}: MobileLayoutProps) {
	return (
		<div className="md:hidden flex flex-col gap-3 w-full max-w-md mx-auto">
			{/* Top Row: Song Info and Queue */}
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3 overflow-hidden">
					{currentSong?.image && currentSong.image.length > 0 ? (
						<div className="relative h-14 w-14 shrink-0 rounded-md overflow-hidden shadow-sm">
							<ProgressiveImage
								images={currentSong.image}
								alt={currentSong.name}
								rounded="default"
								priority
								className="h-full w-full object-cover"
								sizes="(max-width: 640px) 56px, 80px"
							/>
						</div>
					) : (
						<div className="h-14 w-14 shrink-0 bg-muted rounded-md flex items-center justify-center">
							<div className="h-6 w-6 bg-muted-foreground/20 rounded-sm" />
						</div>
					)}
					<div className="min-w-0 flex flex-col justify-center">
						<h3 className="font-semibold text-sm truncate text-foreground leading-tight">
							{currentSong?.name || "No song playing"}
						</h3>
						<div className="text-xs text-muted-foreground truncate mt-0.5">
							{currentSong?.artists?.primary?.map((artist, index) => (
								<span key={artist.id}>
									{artist.name}
									{index < (currentSong.artists.primary.length ?? 0) - 1 &&
										", "}
								</span>
							)) || "Select a song"}
						</div>
					</div>
				</div>

				<div className="shrink-0 flex items-center gap-1">
					<VolumeControl volume={volume} onSetVolume={onSetVolume} />
					<QueueButton
						queue={queue}
						currentIndex={currentIndex}
						onRemoveFromQueue={onRemoveFromQueue}
						onReorderQueue={onReorderQueue}
					/>
				</div>
			</div>

			{/* Progress Bar */}
			<div className="w-full">
				<ProgressBar
					currentTime={currentTime}
					duration={duration}
					onSeekTo={onSeekTo}
				/>
			</div>

			{/* Controls Section */}
			<div className="flex justify-center items-center">
				<PlaybackControls
					isPlaying={isPlaying}
					queueLength={queue.length}
					onTogglePlayPause={onTogglePlayPause}
					onPlayPrevious={onPlayPrevious}
					onPlayNext={onPlayNext}
				/>
			</div>
		</div>
	);
});
