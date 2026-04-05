"use client";

import { Disc3 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
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

/**
 * Album Card Skeleton - Loading placeholder
 */
const AlbumCardSkeleton = () => (
	<Card className="overflow-hidden bg-accent/20 animate-pulse">
		<CardContent className="p-4">
			<div className="space-y-3">
				<Skeleton className="aspect-square w-full rounded-lg" />
				<div className="space-y-2">
					<Skeleton className="h-4 w-3/4 rounded" />
					<Skeleton className="h-3 w-1/2 rounded" />
					<Skeleton className="h-3 w-1/3 rounded" />
				</div>
			</div>
		</CardContent>
	</Card>
);

export const AlbumsList = memo(function AlbumsList({
	albums,
	isLoading = false,
	loadingCount = 6,
}: AlbumsListProps) {
	const router = useRouter();

	if (isLoading) {
		return (
			<div className="space-y-3">
				<motion.h2
					className="text-lg sm:text-xl md:text-2xl font-semibold"
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
				>
					Albums
				</motion.h2>
				<motion.div
					className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
					initial="hidden"
					animate="show"
					transition={{ staggerChildren: 0.05 }}
				>
					{Array.from({ length: loadingCount }).map((_, i) => {
						const skeletonId = `album-skeleton-${i}`;
						return (
							<motion.div
								key={skeletonId}
								variants={{
									hidden: { opacity: 0, scale: 0.95 },
									show: { opacity: 1, scale: 1 },
								}}
							>
								<AlbumCardSkeleton />
							</motion.div>
						);
					})}
				</motion.div>
			</div>
		);
	}

	if (albums.length === 0) {
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
				Albums
			</motion.h2>
			<motion.div
				className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
				initial="hidden"
				animate="show"
				transition={{ staggerChildren: 0.05 }}
			>
				{albums.map((album) => (
					<motion.div
						key={album.id}
						variants={{
							hidden: { opacity: 0, scale: 0.95 },
							show: { opacity: 1, scale: 1 },
						}}
					>
						<Link href={`/album?id=${album.id}`}>
							<Card className="overflow-hidden hover:bg-accent/50 transition-all duration-200 hover:shadow-lg hover:scale-105">
								<CardContent className="p-3 sm:p-4">
									<div className="space-y-3">
										<div className="relative aspect-square w-full">
											{album.image && album.image.length > 0 ? (
												<ProgressiveImage
													images={album.image}
													alt={
														isAlbumSearchResult(album)
															? album.name
															: album.title
													}
													entityType={EntityType.ALBUM}
													rounded="default"
													sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center bg-muted rounded">
													<Disc3 className="h-12 w-12 text-muted-foreground" />
												</div>
											)}
										</div>
										<div className="space-y-1">
											<h3 className="font-medium truncate text-sm sm:text-base">
												{isAlbumSearchResult(album) ? album.name : album.title}
											</h3>
											{isAlbumSearchResult(album) && album.artists?.primary ? (
												<div className="text-xs sm:text-sm text-muted-foreground truncate">
													{album.artists.primary.map((artist, index) => (
														<span key={artist.id}>
															<button
																type="button"
																className="hover:underline cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit"
																onClick={(e) => {
																	e.preventDefault();
																	e.stopPropagation();
																	router.push(`/artist?id=${artist.id}`);
																}}
															>
																{artist.name}
															</button>
															{index < album.artists.primary.length - 1 && ", "}
														</span>
													))}
												</div>
											) : (
												<p className="text-xs sm:text-sm text-muted-foreground truncate">
													{isAlbumSearchResult(album)
														? album.artists?.primary
																?.map((a) => a.name)
																.join(", ")
														: album.artist}
												</p>
											)}
											<p className="text-xs text-muted-foreground">
												{album.year} ·{" "}
												{isAlbumSearchResult(album)
													? album.language
													: album.language}
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
