"use client";

import { useQueryState } from "nuqs";
import { SongHeader } from "@/components/song/song-header";
import { SongSuggestions } from "@/components/song/song-suggestions";
import { Card, CardContent } from "@/components/ui/card";
import { useOffline } from "@/hooks/cache";
import { useSongSuggestions } from "@/hooks/data/queries";
import { useSongFromQuery } from "@/hooks/pages/use-song";
import { useOfflinePlayerActions } from "@/hooks/player/use-offline-player";
import { detailedSongToSong } from "@/lib/utils";

export function Client() {
	const [id] = useQueryState("id");
	const { playSong, addToQueue } = useOfflinePlayerActions();
	const isOfflineMode = useOffline();

	const { data: songData } = useSongFromQuery();
	const { data: suggestions = [] } = useSongSuggestions(id || "", 10, {
		enabled: !!id && !isOfflineMode,
	});

	const song = songData?.[0];
	const filteredSuggestions = suggestions;

	if (!id) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">Song ID is required</p>
			</div>
		);
	}

	if (isOfflineMode) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Card className="text-center py-12">
					<CardContent>
						<p className="text-muted-foreground">
							Song details are not available in offline mode. Please disable
							offline mode to view this song.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!song) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">Song not found</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8 pb-32 space-y-8">
			<SongHeader
				song={song}
				onPlay={() => playSong(song)}
				onAddToQueue={() => addToQueue(song)}
			/>

			<SongSuggestions
				suggestions={filteredSuggestions.map(detailedSongToSong)}
			/>
		</div>
	);
}
