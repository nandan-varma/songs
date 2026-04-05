"use client";

import { Users } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
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

/**
 * Artist Card Skeleton - Loading placeholder
 */
const ArtistCardSkeleton = () => (
	<Card className="overflow-hidden bg-accent/20 animate-pulse">
		<CardContent className="p-4">
			<div className="space-y-3">
				<Skeleton className="aspect-square w-full rounded-full" />
				<div className="space-y-2 text-center">
					<Skeleton className="h-4 w-3/4 rounded mx-auto" />
					<Skeleton className="h-3 w-1/2 rounded mx-auto" />
				</div>
			</div>
		</CardContent>
	</Card>
);

export const ArtistsList = memo(function ArtistsList({
	artists,
	isLoading = false,
	loadingCount = 6,
}: ArtistsListProps) {
	if (isLoading) {
		return (
			<div className="space-y-3">
				<motion.h2
					className="text-lg sm:text-xl md:text-2xl font-semibold"
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
				>
					Artists
				</motion.h2>
				<motion.div
					className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
					initial="hidden"
					animate="show"
					transition={{ staggerChildren: 0.05 }}
				>
					{Array.from({ length: loadingCount }).map((_, i) => {
						const skeletonId = `artist-skeleton-${i}`;
						return (
							<motion.div
								key={skeletonId}
								variants={{
									hidden: { opacity: 0, scale: 0.95 },
									show: { opacity: 1, scale: 1 },
								}}
							>
								<ArtistCardSkeleton />
							</motion.div>
						);
					})}
				</motion.div>
			</div>
		);
	}

	if (artists.length === 0) {
		return null;
	}

	return (
		<div className="space-y-3">
			<motion.h2
				className="text-lg sm:text-xl md:text-2xl font-semibold"
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
			>
				Artists
			</motion.h2>
			<motion.div
				className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
				initial="hidden"
				animate="show"
				transition={{ staggerChildren: 0.05 }}
			>
				{artists.map((artist) => (
					<motion.div
						key={artist.id}
						variants={{
							hidden: { opacity: 0, scale: 0.95 },
							show: { opacity: 1, scale: 1 },
						}}
					>
						<Link href={`/artist?id=${artist.id}`}>
							<Card className="overflow-hidden hover:bg-accent/50 transition-all duration-200 hover:shadow-lg hover:scale-105">
								<CardContent className="p-3 sm:p-4">
									<div className="space-y-3">
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
													sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center bg-muted rounded-full">
													<Users className="h-12 w-12 text-muted-foreground" />
												</div>
											)}
										</div>
										<div className="text-center">
											<h3 className="font-medium truncate text-sm sm:text-base">
												{isArtistSearchResult(artist)
													? artist.name
													: artist.title}
											</h3>
											<p className="text-xs sm:text-sm text-muted-foreground capitalize">
												{isArtistSearchResult(artist)
													? artist.role
													: artist.description}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</Link>
					</motion.div>
				))}
			</motion.div>
		</div>
	);
});
