"use client";

import { motion } from "motion/react";
import { Users } from "lucide-react";
import Link from "next/link";
import {
	type Artist,
	type ArtistSearchResult,
	EntityType,
} from "@/types/entity";
import { ProgressiveImage } from "./common/progressive-image";
import { Card, CardContent } from "./ui/card";

interface ArtistsListProps {
	artists: (Artist | ArtistSearchResult)[];
}

function isArtistSearchResult(
	artist: Artist | ArtistSearchResult,
): artist is ArtistSearchResult {
	return "name" in artist;
}

export function ArtistsList({ artists }: ArtistsListProps) {
	if (artists.length === 0) {
		return null;
	}

	return (
		<div className="space-y-3">
			<motion.h2
				className="text-2xl font-semibold"
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
			>
				Artists
			</motion.h2>
			<motion.div
				className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
							<Card className="overflow-hidden hover:bg-accent/50 transition-colors">
								<CardContent className="p-4">
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
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center bg-muted rounded-full">
													<Users className="h-12 w-12 text-muted-foreground" />
												</div>
											)}
										</div>
										<div className="text-center">
											<h3 className="font-medium truncate">
												{isArtistSearchResult(artist)
													? artist.name
													: artist.title}
											</h3>
											<p className="text-sm text-muted-foreground capitalize">
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
}
