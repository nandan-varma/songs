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
		<div className="flex items-center gap-3">
			<Button
				variant="ghost"
				size="icon"
				onClick={onPlayPrevious}
				disabled={!hasQueue}
				className="h-10 w-10"
				aria-label="Previous track"
			>
				<SkipBack className="h-5 w-5" />
			</Button>

			<Button
				variant="default"
				size="icon"
				onClick={onTogglePlayPause}
				className="h-12 w-12"
				aria-label={isPlaying ? "Pause" : "Play"}
			>
				{isPlaying ? (
					<Pause className="h-6 w-6" />
				) : (
					<Play className="h-6 w-6 ml-0.5" />
				)}
			</Button>

			<Button
				variant="ghost"
				size="icon"
				onClick={onPlayNext}
				disabled={!hasQueue}
				className="h-10 w-10"
				aria-label="Next track"
			>
				<SkipForward className="h-5 w-5" />
			</Button>
		</div>
	);
});
