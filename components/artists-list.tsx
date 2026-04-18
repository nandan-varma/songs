"use client";

import { Users } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { memo, useState } from "react";
import { CardPlayButton } from "@/components/common/card-play-button";
import { Skeleton } from "@/components/ui/skeleton";
import { getArtistById } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { logError } from "@/lib/utils/logger";
import type { Artist, ArtistSearchResult } from "@/types/entity";
import { EntityType } from "@/types/entity";
import { ProgressiveImage } from "./common/progressive-image";
import { Card, CardContent } from "./ui/card";

interface ArtistsListProps {
	artists: (Artist | ArtistSearchResult)[];
	isLoading?: boolean;
	loadingCount?: number;
}

function isArtistSearchResult(
	artist: Artist | ArtistSearchResult,
): artist is ArtistSearchResult {
	return "name" in artist;
}

const ArtistCardSkeleton = () => (
	<Card className="overflow-hidden bg-accent/20 animate-pulse">
		<CardContent className="p-2">
			<div className="space-y-2">
				<Skeleton className="aspect-square w-full rounded-full" />
				<div className="space-y-1">
					<Skeleton className="h-3 w-3/4 rounded mx-auto" />
					<Skeleton className="h-2 w-1/2 rounded mx-auto" />
				</div>
			</div>
		</CardContent>
	</Card>
);

export const ArtistsList = memo(function ArtistsList({
	artists,
	isLoading = false,
	loadingCount = 10,
}: ArtistsListProps) {
	const [playingId, setPlayingId] = useState<string | null>(null);

	const handlePlay = async (artist: Artist | ArtistSearchResult) => {
		try {
			setPlayingId(artist.id);
			const detailed = await getArtistById(artist.id, { songCount: 20 });
			if (detailed?.topSongs && detailed.topSongs.length > 0) {
				useAppStore.getState().playQueue(detailed.topSongs);
			}
		} catch (error) {
			logError("ArtistsList:play", error);
		} finally {
			setPlayingId(null);
		}
	};

	const handleShuffle = async (artist: Artist | ArtistSearchResult) => {
		try {
			setPlayingId(artist.id);
			const detailed = await getArtistById(artist.id, { songCount: 20 });
			if (detailed?.topSongs && detailed.topSongs.length > 0) {
				const shuffled = [...detailed.topSongs].sort(() => Math.random() - 0.5);
				useAppStore.getState().playQueue(shuffled);
			}
		} catch (error) {
			logError("ArtistsList:shuffle", error);
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
					Artists
				</motion.h2>
				<motion.div
					className="grid gap-2 sm:gap-2.5 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
					initial="hidden"
					animate="show"
					transition={{ staggerChildren: 0.03 }}
				>
					{Array.from({ length: loadingCount }).map((_, i) => (
						<motion.div
							key={`artist-skeleton-${i}`}
							variants={{
								hidden: { opacity: 0, scale: 0.95 },
								show: { opacity: 1, scale: 1 },
							}}
						>
							<ArtistCardSkeleton />
						</motion.div>
					))}
				</motion.div>
			</div>
		);
	}

	if (artists.length === 0) {
		return null;
	}

	return (
		<div className="space-y-2">
			<motion.h2
				className="text-base sm:text-lg md:text-xl font-semibold"
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
			>
				Artists
			</motion.h2>
			<motion.div
				className="grid gap-2 sm:gap-2.5 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
				initial="hidden"
				animate="show"
				transition={{ staggerChildren: 0.03 }}
			>
				{artists.map((artist) => (
					<motion.div
						key={artist.id}
						variants={{
							hidden: { opacity: 0, scale: 0.95 },
							show: { opacity: 1, scale: 1 },
						}}
					>
						<Card className="overflow-hidden group hover:bg-accent/60 transition-all duration-200 hover:shadow-lg hover:ring-1 hover:ring-primary/30">
							<CardContent className="p-2">
								<Link href={`/artist?id=${artist.id}`} className="block">
									<div className="relative aspect-square w-full">
										{artist.image && artist.image.length > 0 ? (
											<ProgressiveImage
												images={artist.image}
												alt={
													isArtistSearchResult(artist)
														? artist.name
														: artist.title
												}
												entityType={EntityType.ARTIST}
												rounded="full"
												sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center bg-muted rounded-full">
												<Users className="h-8 w-8 text-muted-foreground" />
											</div>
										)}
										<CardPlayButton
											onPlay={(e) => {
												e.preventDefault();
												e.stopPropagation();
												handlePlay(artist);
											}}
											onShuffle={(e) => {
												e.preventDefault();
												e.stopPropagation();
												handleShuffle(artist);
											}}
											isLoading={playingId === artist.id}
											iconType="shuffle"
										/>
									</div>
									<div className="text-center mt-2">
										<h3 className="font-medium truncate text-xs sm:text-sm">
											{isArtistSearchResult(artist)
												? artist.name
												: artist.title}
										</h3>
										<p className="text-[10px] sm:text-xs text-muted-foreground capitalize">
											{isArtistSearchResult(artist)
												? artist.role
												: artist.description}
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
