"use client";

import { Loader2, Play, Shuffle } from "lucide-react";
import { motion } from "motion/react";
import { memo } from "react";

interface CardPlayButtonProps {
	onPlay: (e: React.MouseEvent) => void;
	onShuffle?: (e: React.MouseEvent) => void;
	isLoading?: boolean;
	iconType?: "play" | "shuffle";
	className?: string;
}

export const CardPlayButton = memo(function CardPlayButton({
	onPlay,
	onShuffle,
	isLoading = false,
	iconType = "play",
	className = "",
}: CardPlayButtonProps) {
	if (isLoading) {
		return (
			<div className="absolute bottom-2 right-2">
				<div className="h-10 w-10 rounded-full bg-primary/80 flex items-center justify-center">
					<Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
				</div>
			</div>
		);
	}

	return (
		<div
			className={`absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${className}`}
		>
			{onShuffle && (
				<motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
					<button
						type="button"
						onClick={onShuffle}
						className="h-9 w-9 rounded-full bg-secondary/90 hover:bg-secondary flex items-center justify-center shadow-lg ring-1 ring-white/20"
						aria-label="Shuffle play"
					>
						<Shuffle className="h-4 w-4 text-secondary-foreground" />
					</button>
				</motion.div>
			)}
			<motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
				<button
					type="button"
					onClick={onPlay}
					className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center shadow-lg ring-1 ring-primary/30 hover:ring-primary/50 glow-play-button"
					aria-label={iconType === "shuffle" ? "Play" : "Play"}
				>
					{iconType === "shuffle" ? (
						<Play className="h-5 w-5 fill-current text-primary-foreground ml-0.5" />
					) : (
						<Play className="h-5 w-5 fill-current text-primary-foreground ml-0.5" />
					)}
				</button>
			</motion.div>
		</div>
	);
});
