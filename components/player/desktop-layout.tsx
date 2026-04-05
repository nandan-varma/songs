"use client";

import { memo } from "react";
import type { DetailedSong } from "@/types/entity";
import { PlaybackControls } from "./playback-controls";
import { ProgressBar } from "./progress-bar";
import { QueueButton } from "./queue-button";
import { SongInfo } from "./song-info";
import { VolumeControl } from "./volume-control";

interface DesktopLayoutProps {
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
 * Desktop-optimized player layout
 * - Horizontal arrangement for wide screens
 * - Large touch targets for comfort
 * - Single responsibility: Desktop UI composition
 */
export const DesktopLayout = memo(function DesktopLayout({
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
}: DesktopLayoutProps) {
	return (
		<div className="hidden md:flex items-center justify-between w-full">
			{/* Left: Song Info */}
			<div className="flex w-[30%] min-w-[180px] justify-start">
				<SongInfo currentSong={currentSong} />
			</div>

			{/* Center: Controls & Progress */}
			<div className="flex flex-col items-center justify-center max-w-[40%] flex-1">
				<div className="flex items-center gap-6 mb-2">
					<PlaybackControls
						isPlaying={isPlaying}
						queueLength={queue.length}
						onTogglePlayPause={onTogglePlayPause}
						onPlayPrevious={onPlayPrevious}
						onPlayNext={onPlayNext}
					/>
				</div>

				<div className="w-full max-w-[600px]">
					<ProgressBar
						currentTime={currentTime}
						duration={duration}
						onSeekTo={onSeekTo}
					/>
				</div>
			</div>

			{/* Right: Volume & Queue */}
			<div className="flex w-[30%] min-w-[180px] items-center justify-end gap-3 pr-2">
				<QueueButton
					queue={queue}
					currentIndex={currentIndex}
					onRemoveFromQueue={onRemoveFromQueue}
					onReorderQueue={onReorderQueue}
				/>
				<div className="w-[120px]">
					<VolumeControl volume={volume} onSetVolume={onSetVolume} />
				</div>
			</div>
		</div>
	);
});
