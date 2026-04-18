"use client";

import { ListMusic } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { memo, useState } from "react";
import { CardPlayButton } from "@/components/common/card-play-button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlaylistById } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { logError } from "@/lib/utils/logger";
import { EntityType, type Playlist } from "@/types/entity";
import { ProgressiveImage } from "./common/progressive-image";
import { Card, CardContent } from "./ui/card";

interface PlaylistsListProps {
	playlists: Playlist[];
	isLoading?: boolean;
	loadingCount?: number;
}

const PlaylistCardSkeleton = () => (
	<Card className="overflow-hidden bg-accent/20 animate-pulse">
		<CardContent className="p-2">
			<div className="space-y-2">
				<Skeleton className="aspect-square w-full rounded" />
				<div className="space-y-1">
					<Skeleton className="h-3 w-3/4 rounded" />
					<Skeleton className="h-2 w-1/2 rounded" />
				</div>
			</div>
		</CardContent>
	</Card>
);

export const PlaylistsList = memo(function PlaylistsList({
	playlists,
	isLoading = false,
	loadingCount = 8,
}: PlaylistsListProps) {
	const [playingId, setPlayingId] = useState<string | null>(null);

	const handlePlay = async (playlist: Playlist) => {
		try {
			setPlayingId(playlist.id);
			const detailed = await getPlaylistById(playlist.id);
			if (detailed?.songs && detailed.songs.length > 0) {
				useAppStore.getState().playQueue(detailed.songs);
			}
		} catch (error) {
			logError("PlaylistsList:play", error);
		} finally {
			setPlayingId(null);
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-2">
				<motion.h2
					className="text-base sm:text-lg md:text-xl font-semibold"
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
				>
					Playlists
				</motion.h2>
				<motion.div
					className="grid gap-2 sm:gap-2.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
					initial="hidden"
					animate="show"
					transition={{ staggerChildren: 0.03 }}
				>
					{Array.from({ length: loadingCount }).map((_, i) => (
						<motion.div
							key={`playlist-skeleton-${i}`}
							variants={{
								hidden: { opacity: 0, scale: 0.95 },
								show: { opacity: 1, scale: 1 },
							}}
						>
							<PlaylistCardSkeleton />
						</motion.div>
					))}
				</motion.div>
			</div>
		);
	}

	if (playlists.length === 0) {
		return null;
	}

	return (
		<div className="space-y-2">
			<motion.h2
				className="text-base sm:text-lg md:text-xl font-semibold"
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
			>
				Playlists
			</motion.h2>
			<motion.div
				className="grid gap-2 sm:gap-2.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
				initial="hidden"
				animate="show"
				transition={{ staggerChildren: 0.03 }}
			>
				{playlists.map((playlist) => (
					<motion.div
						key={playlist.id}
						variants={{
							hidden: { opacity: 0, scale: 0.95 },
							show: { opacity: 1, scale: 1 },
						}}
					>
						<Card className="overflow-hidden group hover:bg-accent/60 transition-all duration-200 hover:shadow-lg hover:ring-1 hover:ring-primary/30">
							<CardContent className="p-2">
								<Link href={`/playlist?id=${playlist.id}`} className="block">
									<div className="relative aspect-square w-full">
										{playlist.image && playlist.image.length > 0 ? (
											<ProgressiveImage
												images={playlist.image}
												alt={playlist.title}
												entityType={EntityType.PLAYLIST}
												rounded="default"
												sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center bg-muted rounded">
												<ListMusic className="h-8 w-8 text-muted-foreground" />
											</div>
										)}
										<CardPlayButton
											onPlay={(e) => {
												e.preventDefault();
												e.stopPropagation();
												handlePlay(playlist);
											}}
											isLoading={playingId === playlist.id}
										/>
									</div>
									<div className="space-y-0.5 mt-2">
										<h3 className="font-medium truncate text-xs sm:text-sm">
											{playlist.title}
										</h3>
										<p className="text-[10px] sm:text-xs text-muted-foreground truncate">
											{playlist.description}
										</p>
									</div>
								</Link>
							</CardContent>
						</Card>
					</motion.div>
				))}
			</motion.div>
		</div>
	);
});
