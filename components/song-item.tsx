"use client";

import { Loader2, Play, Plus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { memo, useCallback, useState } from "react";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { SongActionMenu } from "@/components/common/song-action-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSongById } from "@/lib/api";
import { useAppStore } from "@/lib/store";
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

	const handlePlay = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (isLoading) return;

			try {
				setIsLoading(true);
				const [detailedSong] = await getSongById(song.id);
				if (!detailedSong) {
					return;
				}

				const state = useAppStore.getState();
				state.playSong(detailedSong);
				state.addToPlaybackHistory(detailedSong);
			} catch (error) {
				logError("SongItem:play", error);
			} finally {
				setIsLoading(false);
			}
		},
		[song.id, isLoading],
	);

	const handleAddToQueue = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (isLoading) return;

			try {
				setIsLoading(true);
				const [detailedSong] = await getSongById(song.id);
				if (!detailedSong) {
					return;
				}

				useAppStore.getState().addSongToQueue(detailedSong);
			} catch (error) {
				logError("SongItem:addToQueue", error);
			} finally {
				setIsLoading(false);
			}
		},
		[song.id, isLoading],
	);

	// Truncate artists to first 2 on mobile
	const displayArtists =
		song.primaryArtists.split(", ").length > 2
			? `${song.primaryArtists.split(", ").slice(0, 2).join(", ")}...`
			: song.primaryArtists;

	// Image sizes with proper mobile touch targets - mobile (48px), tablet (56px), desktop (64px)
	const imageSize = compact
		? "h-10 w-10 sm:h-12 sm:w-12 md:h-12 md:w-12"
		: "h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16";

	// Touch-friendly button sizes - minimum 40px on all screens
	const buttonSize = compact
		? "h-9 w-9 sm:h-10 sm:w-10 md:h-10 md:w-10"
		: "h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12";
	const iconSize = compact
		? "h-4 w-4 sm:h-4 sm:w-4 md:h-4 md:w-4"
		: "h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6";

	return (
		<Card className="overflow-hidden hover:bg-accent/50 transition-all duration-200 hover:shadow-md">
			<CardContent
				className={`p-3 sm:p-4 ${compact ? "md:p-3" : "md:p-4"} overflow-x-hidden`}
			>
				<div className="flex items-start gap-3 sm:gap-4 md:gap-4 max-w-full min-h-14">
					{/* Album Art */}
					<Link
						href={`/song?id=${song.id}`}
						className={`relative ${imageSize} shrink-0 overflow-hidden rounded-lg transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
					>
						<ProgressiveImage
							images={song.image}
							alt={song.title}
							className="object-cover transition-transform hover:scale-105"
							sizes="48px"
						/>
					</Link>

					{/* Song Info */}
					<div className="flex-1 min-w-0 py-1">
						<Link href={`/song?id=${song.id}`} className="block group">
							<h3
								className={`font-medium truncate group-hover:text-primary transition-colors duration-200 ${
									compact
										? "text-xs sm:text-sm md:text-sm"
										: "text-sm sm:text-base md:text-base"
								} leading-tight`}
							>
								{song.title}
							</h3>
						</Link>
						<p
							className={`text-muted-foreground truncate mt-1 ${
								compact
									? "text-xs sm:text-xs md:text-xs"
									: "text-xs sm:text-sm md:text-sm"
							}`}
						>
							{displayArtists}
						</p>
						<p
							className={`text-muted-foreground/70 truncate mt-0.5 ${
								compact
									? "text-[10px] sm:text-xs md:text-xs"
									: "text-xs sm:text-xs md:text-xs"
							}`}
						>
							{song.album}
						</p>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-2 sm:gap-2 md:gap-3 shrink-0 items-center pt-0">
						{/* Play Button - Always visible with better touch target */}
						<motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
							<Button
								size="icon"
								variant="ghost"
								onClick={handlePlay}
								disabled={isLoading}
								aria-label="Play song"
								className={`${buttonSize} hover:bg-primary/20 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary`}
							>
								{isLoading ? (
									<Loader2 className={`${iconSize} animate-spin`} />
								) : (
									<Play className={`${iconSize} fill-current`} />
								)}
							</Button>
						</motion.div>

						{/* Add to Queue - Hidden on mobile, visible on tablet+ */}
						<motion.div
							whileHover={{ scale: 1.08 }}
							whileTap={{ scale: 0.92 }}
							className="hidden sm:block"
						>
							<Button
								size="icon"
								variant="ghost"
								onClick={handleAddToQueue}
								disabled={isLoading}
								aria-label="Add to queue"
								className={`${buttonSize} hover:bg-primary/20 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary`}
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
