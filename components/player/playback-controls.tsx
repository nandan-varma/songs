"use client";

import {
	PauseIcon,
	PlayIcon,
	Repeat1Icon,
	RepeatIcon,
	ShuffleIcon,
	SkipBackIcon,
	SkipForwardIcon,
} from "@animateicons/react/lucide";
import { motion } from "motion/react";
import { memo, useCallback } from "react";
import { useIsShuffleEnabled, useRepeatMode } from "@/hooks/use-store";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
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
	const isShuffleEnabled = useIsShuffleEnabled();
	const repeatMode = useRepeatMode();

	const handleShuffleToggle = useCallback(() => {
		useAppStore.getState().toggleShuffle();
	}, []);

	const handleRepeatToggle = useCallback(() => {
		const nextMode =
			repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
		useAppStore.getState().setRepeatMode(nextMode);
	}, [repeatMode]);

	return (
		<div className="flex items-center gap-3 sm:gap-4 md:gap-5">
			<Button
				variant="ghost"
				size="icon"
				onClick={handleShuffleToggle}
				className={cn(
					"h-9 w-9 md:h-10 md:w-10 hover:bg-transparent hover:text-primary transition-colors focus:outline-none focus:ring-0",
					isShuffleEnabled ? "text-primary" : "text-muted-foreground",
				)}
				aria-label="Toggle shuffle"
			>
				<ShuffleIcon size={20} />
				{isShuffleEnabled && (
					<div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
				)}
			</Button>

			<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
				<Button
					variant="ghost"
					size="icon"
					onClick={onPlayPrevious}
					disabled={!hasQueue}
					className="h-10 w-10 md:h-11 md:w-11 text-foreground hover:bg-transparent hover:text-primary transition-colors focus:outline-none focus:ring-0"
					aria-label="Previous track"
				>
					<SkipBackIcon size={24} className="fill-current" />
				</Button>
			</motion.div>

			<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
				<Button
					variant="default"
					size="icon"
					onClick={onTogglePlayPause}
					className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-all focus:outline-none shadow-md"
					aria-label={isPlaying ? "Pause" : "Play"}
				>
					{isPlaying ? (
						<PauseIcon size={28} className="fill-current" />
					) : (
						<PlayIcon size={28} className="ml-1 fill-current" />
					)}
				</Button>
			</motion.div>

			<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
				<Button
					variant="ghost"
					size="icon"
					onClick={onPlayNext}
					disabled={!hasQueue}
					className="h-10 w-10 md:h-11 md:w-11 text-foreground hover:bg-transparent hover:text-primary transition-colors focus:outline-none focus:ring-0"
					aria-label="Next track"
				>
					<SkipForwardIcon size={24} className="fill-current" />
				</Button>
			</motion.div>

			<Button
				variant="ghost"
				size="icon"
				onClick={handleRepeatToggle}
				className={cn(
					"h-9 w-9 md:h-10 md:w-10 hover:bg-transparent hover:text-primary transition-colors focus:outline-none focus:ring-0 relative",
					repeatMode !== "off" ? "text-primary" : "text-muted-foreground",
				)}
				aria-label="Toggle repeat"
			>
				{repeatMode === "one" ? (
					<Repeat1Icon size={20} />
				) : (
					<RepeatIcon size={20} />
				)}
				{repeatMode !== "off" && (
					<div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
				)}
			</Button>
		</div>
	);
});
