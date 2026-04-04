"use client";

import { useQueryState } from "nuqs";
import { QueryParamDetailShell } from "@/components/entity/query-param-detail-shell";
import { useArtist } from "@/hooks/data/queries";
import { useIsOffline } from "@/hooks/network/use-is-offline";
import { useOfflinePlayerActions } from "@/hooks/player/use-offline-player";
import type { DetailedSong } from "@/types/entity";
import { ArtistHeaderCard } from "./_components/ArtistHeaderCard";
import { ArtistPageLoading } from "./_components/ArtistPageLoading";
import { ArtistTabs } from "./_components/ArtistTabs";
import { SimilarArtistsGrid } from "./_components/SimilarArtistsGrid";

export function Client() {
	const [id] = useQueryState("id");
	const { playQueue } = useOfflinePlayerActions();
	const isOffline = useIsOffline();

	const {
		data: artist,
		error,
		isPending: isArtistPending,
	} = useArtist(id || "", {
		enabled: !!id && !isOffline,
	});

	// Use data from artist object instead of making separate API calls
	// Filter out null values and ensure we always have arrays
	const allSongs: DetailedSong[] =
		artist?.topSongs && artist.topSongs.length > 0 ? artist.topSongs : [];
	const filteredSongs = allSongs;

	return (
		<QueryParamDetailShell
			id={id}
			entityLabel="artist"
			isOffline={isOffline}
			isPending={isArtistPending}
			error={error}
			hasData={!!artist}
			loadingFallback={<ArtistPageLoading />}
		>
			{artist && (
				<div className="container mx-auto space-y-8 px-4 py-8 pb-32">
					<ArtistHeaderCard artist={artist} />
					<ArtistTabs
						artist={artist}
						onPlayTopSongs={() => playQueue(filteredSongs)}
					/>
					<SimilarArtistsGrid artists={artist.similarArtists} />
				</div>
			)}
		</QueryParamDetailShell>
	);
}
