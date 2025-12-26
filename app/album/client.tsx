"use client";

import { Disc3, Play, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { ProgressiveImage } from "@/components/progressive-image";
import { SongsList } from "@/components/songs-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useHistory } from "@/contexts/history-context";
import { useOffline } from "@/contexts/offline-context";
import { usePlayerActions } from "@/contexts/player-context";
import { type DetailedAlbum, EntityType } from "@/lib/types";

interface ClientProps {
	album: DetailedAlbum;
}

export function Client({ album }: ClientProps) {
	const { playQueue, addToQueue } = usePlayerActions();
	const { getFilteredSongs } = useOffline();
	const { addToHistory } = useHistory();

	const filteredSongs = album?.songs ? getFilteredSongs(album.songs) : [];

	// Add to history when album loads
	useEffect(() => {
		if (album) {
			addToHistory({
				id: album.id,
				type: EntityType.ALBUM,
				data: album,
				timestamp: new Date(),
			});
		}
	}, [album, addToHistory]);

	return (
		<div className="container mx-auto px-4 py-8 pb-32 space-y-8">
			{/* Album Header */}
			<Card>
				<CardContent className="p-6">
					<div className="flex flex-col md:flex-row gap-6">
						{/* Album Art */}
						<div className="relative aspect-square w-full md:w-64 flex-shrink-0">
							{album.image && album.image.length > 0 ? (
								<ProgressiveImage
									images={album.image}
									alt={album.name}
									entityType={EntityType.ALBUM}
									rounded="default"
									priority
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center bg-muted rounded-lg">
									<Disc3 className="h-24 w-24 text-muted-foreground" />
								</div>
							)}
						</div>

						{/* Album Details */}
						<div className="flex-1 space-y-4">
							<div>
								<Badge variant="secondary" className="mb-2">
									Album
								</Badge>
								<h1 className="text-4xl font-bold">{album.name}</h1>
							</div>

							<div className="space-y-2">
								<div>
									<span className="text-sm text-muted-foreground">
										Artists:{" "}
									</span>
									{album.artists?.primary?.map((artist, index) => (
										<span key={artist.id}>
											<Link
												href={`/artist?id=${artist.id}`}
												className="text-sm hover:underline"
											>
												{artist.name}
											</Link>
											{index < album.artists.primary.length - 1 && ", "}
										</span>
									))}
								</div>

								<div className="flex gap-4 text-sm text-muted-foreground">
									{album.year && <span>{album.year}</span>}
									{album.language && (
										<span className="capitalize">{album.language}</span>
									)}
									{album.songCount && <span>{album.songCount} songs</span>}
								</div>

								{album.description && (
									<p className="text-sm text-muted-foreground">
										{album.description}
									</p>
								)}
							</div>

							{/* Action Buttons */}
							<div className="flex gap-2">
								<Button
									size="lg"
									onClick={() => {
										playQueue(filteredSongs);
									}}
									className="gap-2"
									disabled={filteredSongs.length === 0}
								>
									<Play className="h-5 w-5" />
									Play All
								</Button>
								<Button
									size="lg"
									variant="outline"
									onClick={() => {
										for (const song of filteredSongs) {
											addToQueue(song);
										}
									}}
									className="gap-2"
									disabled={filteredSongs.length === 0}
								>
									<Plus className="h-5 w-5" />
									Add All to Queue
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Track List */}
			{filteredSongs.length > 0 && <SongsList songs={filteredSongs} />}
		</div>
	);
}
