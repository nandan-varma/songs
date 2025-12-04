"use client";

import { Disc3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Album, type AlbumSearchResult, EntityType } from "@/lib/types";
import { ProgressiveImage } from "./progressive-image";
import { Card, CardContent } from "./ui/card";

interface AlbumsListProps {
	albums: (Album | AlbumSearchResult)[];
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

export function AlbumsList({ albums }: AlbumsListProps) {
	const router = useRouter();

	if (albums.length === 0) {
		return null;
	}

	return (
		<div className="space-y-3">
			<h2 className="text-2xl font-semibold">Albums</h2>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{albums.map((album) => (
					<Link key={album.id} href={`/albums/${album.id}`}>
						<Card className="overflow-hidden hover:bg-accent/50 transition-colors">
							<CardContent className="p-4">
								<div className="space-y-3">
									<div className="relative aspect-square w-full">
										{album.image && album.image.length > 0 ? (
											<ProgressiveImage
												images={album.image}
												alt={
													isAlbumSearchResult(album) ? album.name : album.title
												}
												entityType={EntityType.ALBUM}
												rounded="default"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center bg-muted rounded">
												<Disc3 className="h-12 w-12 text-muted-foreground" />
											</div>
										)}
									</div>
									<div className="space-y-1">
										<h3 className="font-medium truncate">
											{isAlbumSearchResult(album) ? album.name : album.title}
										</h3>
										{isAlbumSearchResult(album) && album.artists?.primary ? (
											<div className="text-sm text-muted-foreground truncate">
												{album.artists.primary.map((artist, index) => (
													<span key={artist.id}>
														<button
															type="button"
															className="hover:underline cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit"
															onClick={(e) => {
																e.preventDefault();
																e.stopPropagation();
																router.push(`/artists/${artist.id}`);
															}}
														>
															{artist.name}
														</button>
														{index < album.artists.primary.length - 1 && ", "}
													</span>
												))}
											</div>
										) : (
											<p className="text-sm text-muted-foreground truncate">
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
				))}
			</div>
		</div>
	);
}
