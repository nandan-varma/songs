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
 * Single responsibility: Desktop UI composition
 */
export function DesktopLayout({
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
		<div className="hidden md:flex items-center gap-6">
			<SongInfo currentSong={currentSong} />

			<div className="flex flex-col items-center gap-3 flex-1 max-w-2xl">
				<PlaybackControls
					isPlaying={isPlaying}
					queueLength={queue.length}
					onTogglePlayPause={onTogglePlayPause}
					onPlayPrevious={onPlayPrevious}
					onPlayNext={onPlayNext}
				/>

				<ProgressBar
					currentTime={currentTime}
					duration={duration}
					onSeekTo={onSeekTo}
				/>
			</div>

			<div className="flex items-center gap-3 w-72 justify-end">
				<VolumeControl volume={volume} onSetVolume={onSetVolume} />
				<QueueButton
					queue={queue}
					currentIndex={currentIndex}
					onRemoveFromQueue={onRemoveFromQueue}
					onReorderQueue={onReorderQueue}
				/>
			</div>
		</div>
	);
}
