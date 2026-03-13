"use client";

import { Loader2, Play, Plus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { memo, useCallback, useState } from "react";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { SongActionMenu } from "@/components/common/song-action-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePlayerActions } from "@/contexts/player-context";
import { useQueueActions } from "@/contexts/queue-context";
import { getSongById } from "@/lib/api";
import { logError } from "@/lib/utils/logger";
import type { Song } from "@/types/entity";

interface SongItemProps {
	song: Song;
	compact?: boolean;
}

/**
 * Optimized song item component for all screen sizes
 * - Mobile: Compact layout with essential controls
 * - Tablet/Desktop: Expanded layout with all controls
 * - Responsive text sizing and spacing
 * - Efficient re-renders with memo
 */
export const SongItem = memo(function SongItem({
	song,
	compact = false,
}: SongItemProps) {
	const [isLoading, setIsLoading] = useState(false);
	const { playSong } = usePlayerActions();
	const { addSong } = useQueueActions();

	const handlePlay = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (isLoading) return;

			try {
				setIsLoading(true);
				const response = await getSongById(song.id);
				if (response.success && response.data && response.data[0]) {
					playSong(response.data[0]);
				}
			} catch (error) {
				logError("SongItem:play", error);
			} finally {
				setIsLoading(false);
			}
		},
		[song.id, playSong, isLoading],
	);

	const handleAddToQueue = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (isLoading) return;

			try {
				setIsLoading(true);
				const response = await getSongById(song.id);
				if (response.success && response.data && response.data[0]) {
					addSong(response.data[0]);
				}
			} catch (error) {
				logError("SongItem:addToQueue", error);
			} finally {
				setIsLoading(false);
			}
		},
		[song.id, addSong, isLoading],
	);

	// Truncate artists to first 2 on mobile
	const displayArtists =
		song.primaryArtists.split(", ").length > 2
			? `${song.primaryArtists.split(", ").slice(0, 2).join(", ")}...`
			: song.primaryArtists;

	// Image sizes: mobile (48px), tablet (56px), desktop (64px)
	const imageSize = compact
		? "h-10 w-10 sm:h-12 sm:w-12"
		: "h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16";

	// Button sizes
	const buttonSize = compact
		? "h-7 w-7 sm:h-8 sm:w-8"
		: "h-8 w-8 sm:h-9 sm:w-9";
	const iconSize = compact
		? "h-3 w-3 sm:h-3.5 sm:w-3.5"
		: "h-3.5 w-3.5 sm:h-4 sm:w-4";

	return (
		<Card className="overflow-hidden hover:bg-accent/50 transition-colors">
			<CardContent
				className={`p-2 sm:p-3 ${compact ? "md:p-2" : "md:p-4"} overflow-x-hidden`}
			>
				<div className="flex items-start gap-2 sm:gap-3 max-w-full">
					{/* Album Art */}
					<Link
						href={`/song?id=${song.id}`}
						className={`relative ${imageSize} shrink-0 overflow-hidden rounded`}
					>
						<ProgressiveImage
							images={song.image}
							alt={song.title}
							className="object-cover transition-transform hover:scale-105"
						/>
					</Link>

					{/* Song Info */}
					<div className="flex-1 min-w-0 py-0.5">
						<Link href={`/song?id=${song.id}`} className="block group">
							<h3
								className={`font-medium truncate group-hover:text-primary transition-colors ${
									compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
								} leading-tight`}
							>
								{song.title}
							</h3>
						</Link>
						<p
							className={`text-muted-foreground truncate mt-0.5 ${
								compact ? "text-[10px] sm:text-xs" : "text-xs"
							}`}
						>
							{displayArtists}
						</p>
						<p
							className={`text-muted-foreground/80 truncate mt-0.5 ${
								compact ? "text-[10px] sm:text-xs" : "text-xs"
							}`}
						>
							{song.album}
						</p>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-0.5 sm:gap-1 shrink-0 items-start pt-0.5">
						{/* Play Button - Always visible */}
						<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
							<Button
								size="icon"
								variant="ghost"
								onClick={handlePlay}
								disabled={isLoading}
								aria-label="Play song"
								className={buttonSize}
							>
								{isLoading ? (
									<Loader2 className={`${iconSize} animate-spin`} />
								) : (
									<Play className={`${iconSize} fill-current`} />
								)}
							</Button>
						</motion.div>

						{/* Add to Queue - Hidden on mobile */}
						<motion.div
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className="hidden sm:block"
						>
							<Button
								size="icon"
								variant="ghost"
								onClick={handleAddToQueue}
								disabled={isLoading}
								aria-label="Add to queue"
								className={buttonSize}
							>
								<Plus className={iconSize} />
							</Button>
						</motion.div>

						{/* Action Menu */}
						<SongActionMenu song={song} />
					</div>
				</div>
			</CardContent>
		</Card>
	);
});
