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

	const displayArtists =
		song.primaryArtists.split(", ").length > 2
			? `${song.primaryArtists.split(", ").slice(0, 2).join(", ")}...`
			: song.primaryArtists;

	const imageSize = compact
		? "h-9 w-9 sm:h-10 sm:w-10"
		: "h-10 w-10 sm:h-12 sm:w-12";
	const buttonSize = compact
		? "h-8 w-8 sm:h-9 sm:w-9"
		: "h-9 w-9 sm:h-10 sm:w-10";
	const iconSize = compact ? "h-3.5 w-3.5" : "h-4 w-4";

	return (
		<Card className="overflow-hidden hover:bg-accent/50 transition-all duration-150 hover:shadow-sm">
			<CardContent
				className={`p-1.5 sm:p-2 ${compact ? "md:p-1.5" : "md:p-2"} overflow-x-hidden`}
			>
				<div className="flex items-start gap-2 sm:gap-3 max-w-full min-h-10">
					<Link
						href={`/song?id=${song.id}`}
						className={`relative ${imageSize} shrink-0 overflow-hidden rounded-md transition-transform duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
					>
						<ProgressiveImage
							images={song.image}
							alt={song.title}
							className="object-cover"
							sizes="40px"
						/>
					</Link>

					<div className="flex-1 min-w-0 py-0.5">
						<Link href={`/song?id=${song.id}`} className="block group">
							<h3
								className={`font-medium truncate group-hover:text-primary transition-colors duration-150 ${
									compact ? "text-xs sm:text-xs" : "text-xs sm:text-sm"
								}`}
							>
								{song.title}
							</h3>
						</Link>
						<p
							className={`text-muted-foreground truncate ${
								compact ? "text-[10px] sm:text-xs" : "text-[10px] sm:text-xs"
							}`}
						>
							{displayArtists}
						</p>
					</div>

					<div className="flex gap-1 sm:gap-1.5 shrink-0 items-center">
						<motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
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

						<motion.div
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.9 }}
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

						<SongActionMenu song={song} />
					</div>
				</div>
			</CardContent>
		</Card>
	);
});
