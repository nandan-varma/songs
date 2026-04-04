"use client";

import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { motion } from "motion/react";
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
		<div className="flex items-center gap-3 sm:gap-4 md:gap-4">
			<motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
				<Button
					variant="ghost"
					size="icon"
					onClick={onPlayPrevious}
					disabled={!hasQueue}
					className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 hover:bg-primary/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary"
					aria-label="Previous track"
				>
					<SkipBack className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6" />
				</Button>
			</motion.div>

			<motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
				<Button
					variant="default"
					size="icon"
					onClick={onTogglePlayPause}
					className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
					aria-label={isPlaying ? "Pause" : "Play"}
				>
					{isPlaying ? (
						<Pause className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
					) : (
						<Play className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 ml-0.5" />
					)}
				</Button>
			</motion.div>

			<motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
				<Button
					variant="ghost"
					size="icon"
					onClick={onPlayNext}
					disabled={!hasQueue}
					className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 hover:bg-primary/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary"
					aria-label="Next track"
				>
					<SkipForward className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6" />
				</Button>
			</motion.div>
		</div>
	);
});
