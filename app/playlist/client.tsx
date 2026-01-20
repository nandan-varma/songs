"use client";

import { Play, Plus } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect } from "react";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { SongsList } from "@/components/songs-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useHistory } from "@/contexts/history-context";
import { useOffline } from "@/contexts/offline-context";
import { usePlaylistFromQuery } from "@/hooks/pages/use-playlist";
import { useOfflinePlayerActions } from "@/hooks/player/use-offline-player";
import { detailedSongToSong } from "@/lib/utils";
import { EntityType } from "@/types/entity";

export function Client() {
	const [id] = useQueryState("id");
	const { playQueue, addToQueue } = useOfflinePlayerActions();
	const { getFilteredSongs, isOfflineMode } = useOffline();
	const { addToHistory } = useHistory();

	const { data: playlist } = usePlaylistFromQuery();

	const filteredSongs = playlist?.songs ? getFilteredSongs(playlist.songs) : [];

	// Add to history when playlist loads
	useEffect(() => {
		if (playlist) {
			addToHistory({
				id: playlist.id,
				type: EntityType.PLAYLIST,
				data: playlist,
				timestamp: new Date(),
			});
		}
	}, [playlist, addToHistory]);

	if (!id) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">Playlist ID is required</p>
			</div>
		);
	}

	if (isOfflineMode) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Card className="text-center py-12">
					<CardContent>
						<p className="text-muted-foreground">
							Playlist details are not available in offline mode. Please disable
							offline mode to view this playlist.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!playlist) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">Playlist not found</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8 pb-32 space-y-8">
			{/* Playlist Header */}
			<Card>
				<CardContent className="p-6">
					<div className="flex flex-col md:flex-row gap-6">
						{/* Playlist Cover */}
						<div className="relative aspect-square w-full md:w-64 flex-shrink-0">
							<ProgressiveImage
								images={playlist.image}
								alt={playlist.name}
								entityType={EntityType.PLAYLIST}
								rounded="default"
								priority
							/>
						</div>

						{/* Playlist Details */}
						<div className="flex-1 space-y-4">
							<div>
								<Badge variant="secondary" className="mb-2">
									Playlist
								</Badge>
								<h1 className="text-4xl font-bold">{playlist.name}</h1>
							</div>

							<div className="flex gap-4 text-sm text-muted-foreground">
								{playlist.year && <span>{playlist.year}</span>}
								{playlist.language && (
									<span className="capitalize">{playlist.language}</span>
								)}
								{playlist.songCount && <span>{playlist.songCount} songs</span>}
							</div>

							{playlist.description && (
								<p className="text-sm text-muted-foreground">
									{playlist.description}
								</p>
							)}

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
