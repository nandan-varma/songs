"use client";

import { useQueryState } from "nuqs";
import { useEffect } from "react";
import { QueryParamDetailShell } from "@/components/entity/query-param-detail-shell";
import { SongHeader } from "@/components/song/song-header";
import { SongSuggestions } from "@/components/song/song-suggestions";
import { useSong, useSongSuggestions } from "@/hooks/data/queries";
import { useIsOffline } from "@/hooks/network/use-is-offline";
import { useOfflinePlayerActions } from "@/hooks/player/use-offline-player";
import { useAppStore } from "@/lib/store";
import { detailedSongToSong } from "@/lib/utils";
import { EntityType } from "@/types/entity";
import { SongPageLoading } from "./loading";

export function Client() {
	const [id] = useQueryState("id");
	const { playSong, addToQueue } = useOfflinePlayerActions();
	const isOffline = useIsOffline();
	const addToVisitHistory = useAppStore((state) => state.addToVisitHistory);

	const {
		data: songData,
		error,
		isPending,
	} = useSong(id || "", {
		enabled: !!id && !isOffline,
	});
	const { data: suggestions = [] } = useSongSuggestions(id || "", 10, {
		enabled: !!id && !isOffline,
	});

	const song = songData?.[0];
	const filteredSuggestions = suggestions;

	// Track visit to song
	useEffect(() => {
		if (song && !isOffline) {
			addToVisitHistory({
				entityId: song.id,
				entityType: EntityType.SONG,
				entityName: song.name,
				image: song.image,
				timestamp: Date.now(),
			});
		}
	}, [song, isOffline, addToVisitHistory]);

	return (
		<QueryParamDetailShell
			id={id}
			entityLabel="song"
			isOffline={isOffline}
			isPending={isPending}
			error={error}
			hasData={!!song}
			loadingFallback={<SongPageLoading />}
		>
			{song && (
				<div className="container mx-auto space-y-8 px-4 py-8 pb-32">
					<SongHeader
						song={song}
						onPlay={() => playSong(song)}
						onAddToQueue={() => addToQueue(song)}
					/>

					<SongSuggestions
						suggestions={filteredSuggestions.map(detailedSongToSong)}
					/>
				</div>
			)}
		</QueryParamDetailShell>
	);
}
