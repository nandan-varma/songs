"use client";

import { Disc3, Loader2, Play, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { ProgressiveImage } from "@/components/progressive-image";
import { SongsList } from "@/components/songs-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useHistory } from "@/contexts/history-context";
import { useOffline } from "@/contexts/offline-context";
import { useAlbum } from "@/hooks/queries";
import { useOfflinePlayerActions } from "@/hooks/use-offline-player";
import { EntityType } from "@/lib/types";
import { detailedSongToSong } from "@/lib/utils";

function AlbumPageContent() {
	const params = useParams();
	const albumId = params.id as string;
	const { playQueue, addToQueue } = useOfflinePlayerActions();
	const { getFilteredSongs, shouldEnableQuery, isOfflineMode } = useOffline();
	const { addToHistory } = useHistory();

	const {
		data: album,
		isLoading,
		error,
	} = useAlbum(albumId, {
		enabled: shouldEnableQuery(),
	});

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

	if (isOfflineMode) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Card className="text-center py-12">
					<CardContent>
						<p className="text-muted-foreground">
							Album details are not available in offline mode. Please disable
							offline mode to view this album.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (error || !album) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">
					{error instanceof Error ? error.message : "Album not found"}
				</p>
			</div>
		);
	}

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
												href={`/artists/${artist.id}`}
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
			{filteredSongs.length > 0 && (
				<SongsList songs={filteredSongs.map(detailedSongToSong)} />
			)}
		</div>
	);
}

export default function AlbumPage() {
	return (
		<ErrorBoundary context="AlbumPage">
			<AlbumPageContent />
		</ErrorBoundary>
	);
}
