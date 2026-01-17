import { ProgressiveImage } from "@/components/progressive-image";
import type { DetailedSong } from "@/lib/types";
import { PlaybackControls } from "./playback-controls";
import { ProgressBar } from "./progress-bar";
import { QueueButton } from "./queue-button";
import { VolumeControl } from "./volume-control";

interface MobileLayoutProps {
	currentSong: DetailedSong;
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
 * Single responsibility: Mobile UI composition
 */
export function MobileLayout({
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
					onRemoveFromQueue={onRemoveFromQueue}
					onReorderQueue={onReorderQueue}
				/>
			</div>

			<ProgressBar
				currentTime={currentTime}
				duration={duration}
				onSeekTo={onSeekTo}
			/>

			<div className="flex items-center justify-between">
				<PlaybackControls
					isPlaying={isPlaying}
					queueLength={queue.length}
					onTogglePlayPause={onTogglePlayPause}
					onPlayPrevious={onPlayPrevious}
					onPlayNext={onPlayNext}
				/>

				<VolumeControl volume={volume} onSetVolume={onSetVolume} />
			</div>
		</div>
	);
}
