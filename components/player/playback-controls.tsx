"use client";

import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { memo } from "react";
import { Button } from "../ui/button";

interface PlaybackControlsProps {
	isPlaying: boolean;
	queueLength: number;
	onTogglePlayPause: () => void;
	onPlayPrevious: () => void;
	onPlayNext: () => void;
}

export const PlaybackControls = memo(function PlaybackControls({
	isPlaying,
	queueLength,
	onTogglePlayPause,
	onPlayPrevious,
	onPlayNext,
}: PlaybackControlsProps) {
	const hasQueue = queueLength > 0;

	return (
		<div className="flex items-center gap-2">
			<Button
				variant="ghost"
				size="icon"
				onClick={onPlayPrevious}
				disabled={!hasQueue}
				className="h-8 w-8 md:h-10 md:w-10"
				aria-label="Previous track"
			>
				<SkipBack className="h-4 w-4 md:h-5 md:w-5" />
			</Button>

			<Button
				variant="default"
				size="icon"
				onClick={onTogglePlayPause}
				className="h-10 w-10 md:h-12 md:w-12"
				aria-label={isPlaying ? "Pause" : "Play"}
			>
				{isPlaying ? (
					<Pause className="h-5 w-5 md:h-6 md:w-6" />
				) : (
					<Play className="h-5 w-5 md:h-6 md:w-6 ml-0.5" />
				)}
			</Button>

			<Button
				variant="ghost"
				size="icon"
				onClick={onPlayNext}
				disabled={!hasQueue}
				className="h-8 w-8 md:h-10 md:w-10"
				aria-label="Next track"
			>
				<SkipForward className="h-4 w-4 md:h-5 md:w-5" />
			</Button>
		</div>
	);
});
