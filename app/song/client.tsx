"use client";

import { shuffle } from "es-toolkit";
import { useQueryState } from "nuqs";
import { useEffect } from "react";
import { QueryParamDetailShell } from "@/components/entity/query-param-detail-shell";
import { SongHeader } from "@/components/song/song-header";
import { SongLyrics } from "@/components/song/song-lyrics";
import { SongSection } from "@/components/song/song-recommendations";
import {
	useAlbum,
	useArtistSongs,
	useSong,
	useSongSuggestions,
} from "@/hooks/data/queries";
import { useIsOffline } from "@/hooks/network/use-is-offline";
import { useOfflinePlayerActions } from "@/hooks/player/use-offline-player";
import { useAppStore } from "@/lib/store";
import { type DetailedSong, EntityType } from "@/types/entity";
import { SongPageLoading } from "./loading";

function uniqueSongs(songs: DetailedSong[]): DetailedSong[] {
	return [...new Map(songs.map((song) => [song.id, song])).values()];
}

export function Client() {
	const [id] = useQueryState("id");
	const { playQueue, addToQueue } = useOfflinePlayerActions();
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
	const artist = song?.artists.primary[0];
	const albumId = song?.album.id;

	const { data: album } = useAlbum(albumId ?? "", {
		enabled: !!albumId && !isOffline,
	});
	const { data: artistSongs } = useArtistSongs(
		artist?.id ?? "",
		"popularity",
		"desc",
		{ enabled: !!artist && !isOffline },
	);

	const withoutCurrent = (songs: DetailedSong[]) =>
		songs.filter((candidate) => candidate.id !== id);
	const albumSongs = withoutCurrent(album?.songs ?? []);
	const moreFromArtist = withoutCurrent(artistSongs?.pages[0]?.songs ?? []);
	const similarSongs = withoutCurrent(suggestions);

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
				<div className="container mx-auto space-y-4 px-2 md:px-4 py-4 md:py-8 pb-32">
					<SongHeader
						song={song}
						onPlay={() => playQueue([song, ...similarSongs])}
						onRadio={() =>
							playQueue([
								song,
								...shuffle(
									uniqueSongs([
										...similarSongs,
										...albumSongs,
										...moreFromArtist,
									]),
								),
							])
						}
						onAddToQueue={() => addToQueue(song)}
					/>

					{song.hasLyrics && <SongLyrics songId={song.id} />}

					<SongSection title="Similar songs" songs={similarSongs} />
					{album && (
						<SongSection title={`From ${album.name}`} songs={albumSongs} />
					)}
					{artist && (
						<SongSection
							title={`More from ${artist.name}`}
							songs={moreFromArtist}
						/>
					)}
				</div>
			)}
		</QueryParamDetailShell>
	);
}
