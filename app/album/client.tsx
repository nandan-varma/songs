"use client";

import { useQueryState } from "nuqs";
import { useEffect } from "react";
import { AlbumHeader } from "@/components/album/album-header";
import { SongsList } from "@/components/songs-list";
import { Card, CardContent } from "@/components/ui/card";
import { useHistory } from "@/contexts/history-context";
import { useOffline } from "@/contexts/offline-context";
import { useAlbumFromQuery } from "@/hooks/pages/use-album";
import { useOfflinePlayerActions } from "@/hooks/use-offline-player";
import { EntityType } from "@/lib/types";
import { detailedSongToSong } from "@/lib/utils";

export function Client() {
	const [id] = useQueryState("id");
	const { playQueue, addToQueue } = useOfflinePlayerActions();
	const { getFilteredSongs, isOfflineMode } = useOffline();
	const { addToHistory } = useHistory();

	const { data: album, error } = useAlbumFromQuery();

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

	if (!id) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">Album ID is required</p>
			</div>
		);
	}

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
			<AlbumHeader
				album={album}
				songsCount={filteredSongs.length}
				onPlayAll={() => playQueue(filteredSongs)}
				onAddAllToQueue={() => {
					for (const song of filteredSongs) {
						addToQueue(song);
					}
				}}
			/>

			{filteredSongs.length > 0 && (
				<SongsList songs={filteredSongs.map(detailedSongToSong)} />
			)}
		</div>
	);
}
