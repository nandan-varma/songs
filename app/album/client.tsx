"use client";

import { useQueryState } from "nuqs";
import { AlbumHeader } from "@/components/album/album-header";
import { QueryParamDetailShell } from "@/components/entity/query-param-detail-shell";
import { SongsList } from "@/components/songs-list";
import { useAlbum } from "@/hooks/data/queries";
import { useIsOffline } from "@/hooks/network/use-is-offline";
import { useOfflinePlayerActions } from "@/hooks/player/use-offline-player";
import { detailedSongToSong } from "@/lib/utils";
import { AlbumPageLoading } from "./loading";

export function Client() {
	const [id] = useQueryState("id");
	const { playQueue, addToQueue } = useOfflinePlayerActions();
	const isOffline = useIsOffline();

	const {
		data: album,
		error,
		isPending,
	} = useAlbum(id || "", {
		enabled: !!id && !isOffline,
	});

	const filteredSongs = album?.songs ?? [];

	return (
		<QueryParamDetailShell
			id={id}
			entityLabel="album"
			isOffline={isOffline}
			isPending={isPending}
			error={error}
			hasData={!!album}
			loadingFallback={<AlbumPageLoading />}
		>
			{album && (
				<div className="container mx-auto space-y-4 md:space-y-8 px-4 py-4 md:py-8 pb-32">
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
			)}
		</QueryParamDetailShell>
	);
}
