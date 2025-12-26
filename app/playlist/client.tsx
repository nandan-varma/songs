"use client";

import { Play, Plus } from "lucide-react";
import { useEffect } from "react";
import { ProgressiveImage } from "@/components/progressive-image";
import { SongsList } from "@/components/songs-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useHistory } from "@/contexts/history-context";
import { useOffline } from "@/contexts/offline-context";
import { usePlayerActions } from "@/contexts/player-context";
import { type DetailedPlaylist, EntityType } from "@/lib/types";

interface ClientProps {
	playlist: DetailedPlaylist;
}

export function Client({ playlist }: ClientProps) {
	const { playQueue, addToQueue } = usePlayerActions();
	const { getFilteredSongs } = useOffline();
	const { addToHistory } = useHistory();

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
			{filteredSongs.length > 0 && <SongsList songs={filteredSongs} />}
		</div>
	);
}
