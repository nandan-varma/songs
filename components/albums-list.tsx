"use client";

import { Disc3 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { memo, useState } from "react";
import { CardPlayButton } from "@/components/common/card-play-button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAlbumById } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { logError } from "@/lib/utils/logger";
import type { Album, AlbumSearchResult } from "@/types/entity";
import { EntityType } from "@/types/entity";
import { ProgressiveImage } from "./common/progressive-image";
import { Card, CardContent } from "./ui/card";

interface AlbumsListProps {
	albums: (Album | AlbumSearchResult)[];
	isLoading?: boolean;
	loadingCount?: number;
}

function isAlbumSearchResult(
	album: Album | AlbumSearchResult,
): album is AlbumSearchResult {
	return (
		"artists" in album &&
		typeof album.artists === "object" &&
		"primary" in album.artists
	);
}

const AlbumCardSkeleton = () => (
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

export const AlbumsList = memo(function AlbumsList({
	albums,
	isLoading = false,
	loadingCount = 10,
}: AlbumsListProps) {
	const [playingId, setPlayingId] = useState<string | null>(null);

	const handlePlay = async (album: Album | AlbumSearchResult) => {
		try {
			setPlayingId(album.id);
			const detailed = await getAlbumById(album.id);
			if (detailed?.songs && detailed.songs.length > 0) {
				useAppStore.getState().playQueue(detailed.songs);
			}
		} catch (error) {
			logError("AlbumsList:play", error);
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
					Albums
				</motion.h2>
				<motion.div
					className="grid gap-2 sm:gap-2.5 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
					initial="hidden"
					animate="show"
					transition={{ staggerChildren: 0.03 }}
				>
					{Array.from({ length: loadingCount }).map((_, i) => (
						<motion.div
							key={`album-skeleton-${i}`}
							variants={{
								hidden: { opacity: 0, scale: 0.95 },
								show: { opacity: 1, scale: 1 },
							}}
						>
							<AlbumCardSkeleton />
						</motion.div>
					))}
				</motion.div>
			</div>
		);
	}

	if (albums.length === 0) {
		return null;
	}

	return (
		<div className="space-y-2">
			<motion.h2
				className="text-base sm:text-lg md:text-xl font-semibold"
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
			>
				Albums
			</motion.h2>
			<motion.div
				className="grid gap-2 sm:gap-2.5 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
				initial="hidden"
				animate="show"
				transition={{ staggerChildren: 0.03 }}
			>
				{albums.map((album) => (
					<motion.div
						key={album.id}
						variants={{
							hidden: { opacity: 0, scale: 0.95 },
							show: { opacity: 1, scale: 1 },
						}}
					>
						<Card className="overflow-hidden group hover:bg-accent/60 transition-all duration-200 hover:shadow-lg hover:ring-1 hover:ring-primary/30">
							<CardContent className="p-2">
								<Link href={`/album?id=${album.id}`} className="block">
									<div className="relative aspect-square w-full">
										{album.image && album.image.length > 0 ? (
											<ProgressiveImage
												images={album.image}
												alt={
													isAlbumSearchResult(album) ? album.name : album.title
												}
												entityType={EntityType.ALBUM}
												rounded="default"
												sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center bg-muted rounded">
												<Disc3 className="h-8 w-8 text-muted-foreground" />
											</div>
										)}
										<CardPlayButton
											onPlay={(e) => {
												e.preventDefault();
												e.stopPropagation();
												handlePlay(album);
											}}
											isLoading={playingId === album.id}
										/>
									</div>
									<div className="space-y-0.5 mt-2">
										<h3 className="font-medium truncate text-xs sm:text-sm">
											{isAlbumSearchResult(album) ? album.name : album.title}
										</h3>
										{isAlbumSearchResult(album) && album.artists?.primary && (
											<p className="text-[10px] sm:text-xs text-muted-foreground truncate">
												{album.artists.primary.map((a) => a.name).join(", ")}
											</p>
										)}
										<p className="text-[10px] text-muted-foreground/70">
											{album.year}
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
