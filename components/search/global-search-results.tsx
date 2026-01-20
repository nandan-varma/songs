"use client";

import { memo } from "react";
import type { useGlobalSearch } from "@/hooks/data/queries";
import { AlbumsList } from "../albums-list";
import { ArtistsList } from "../artists-list";
import { PlaylistsList } from "../playlists-list";
import { SongsList } from "../songs-list";
import { Separator } from "../ui/separator";
import { EmptyState } from "./search-states";

interface GlobalSearchResultsProps {
	results: NonNullable<ReturnType<typeof useGlobalSearch>["data"]>;
	query: string;
}

export const GlobalSearchResults = memo(function GlobalSearchResults({
	results,
	query,
}: GlobalSearchResultsProps) {
	const { songs, albums, artists, playlists } = results.data;

	const hasAnySongs = songs.results.length > 0;
	const hasAnyAlbums = albums.results.length > 0;
	const hasAnyArtists = artists.results.length > 0;
	const hasAnyPlaylists = playlists?.results.length > 0;
	const hasAnyResults =
		hasAnySongs || hasAnyAlbums || hasAnyArtists || hasAnyPlaylists;

	if (!hasAnyResults) {
		return <EmptyState query={query} />;
	}

	return (
		<div className="space-y-8">
			{hasAnySongs && (
				<>
					<SongsList songs={songs.results} />
					<Separator />
				</>
			)}
			{hasAnyAlbums && (
				<>
					<AlbumsList albums={albums.results} />
					<Separator />
				</>
			)}
			{hasAnyArtists && (
				<>
					<ArtistsList artists={artists.results} />
					<Separator />
				</>
			)}
			{hasAnyPlaylists && <PlaylistsList playlists={playlists.results} />}
		</div>
	);
});
