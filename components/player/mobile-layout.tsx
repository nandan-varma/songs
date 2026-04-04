import { memo } from "react";
import { ProgressiveImage } from "@/components/common/progressive-image";
import type { DetailedSong } from "@/types/entity";
import { PlaybackControls } from "./playback-controls";
import { PlaybackMenu } from "./playback-menu";
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
		<div className="md:hidden space-y-3 sm:space-y-4">
			{/* Song Info Section - Better spacing for mobile */}
			<div className="flex items-center gap-3 sm:gap-4">
				{currentSong?.image && currentSong.image.length > 0 ? (
					<div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-lg overflow-hidden">
						<ProgressiveImage
							images={currentSong.image}
							alt={currentSong.name}
							rounded="default"
							priority
							className="h-full w-full object-cover"
							sizes="(max-width: 640px) 80px, 100px"
						/>
					</div>
				) : (
					<div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 bg-muted rounded-lg flex items-center justify-center">
						<div className="h-8 w-8 bg-muted-foreground/20 rounded" />
					</div>
				)}
				<div className="min-w-0 flex-1">
					<h3 className="font-semibold truncate text-sm sm:text-base">
						{currentSong?.name || "No song playing"}
					</h3>
					<div className="text-xs sm:text-sm text-muted-foreground truncate mt-1">
						{currentSong?.artists?.primary?.map((artist, index) => (
							<span key={artist.id}>
								{artist.name}
								{index < (currentSong.artists.primary.length ?? 0) - 1 && ", "}
							</span>
						)) || "Select a song to play"}
					</div>
				</div>

				{/* Queue button in header for mobile */}
				<QueueButton
					queue={queue}
					currentIndex={currentIndex}
					onRemoveFromQueue={onRemoveFromQueue}
					onReorderQueue={onReorderQueue}
				/>
			</div>

			{/* Progress Bar - Full width */}
			<ProgressBar
				currentTime={currentTime}
				duration={duration}
				onSeekTo={onSeekTo}
			/>

			{/* Controls Section - Better spacing and touch targets */}
			<div className="flex items-center justify-between gap-2 sm:gap-3">
				<div className="flex-shrink-0 w-10 sm:w-12">
					<PlaybackMenu />
				</div>
				<div className="flex-1 flex justify-center">
					<PlaybackControls
						isPlaying={isPlaying}
						queueLength={queue.length}
						onTogglePlayPause={onTogglePlayPause}
						onPlayPrevious={onPlayPrevious}
						onPlayNext={onPlayNext}
					/>
				</div>
				<div className="flex-shrink-0 w-10 sm:w-12">
					<VolumeControl volume={volume} onSetVolume={onSetVolume} />
				</div>
			</div>
		</div>
	);
});
