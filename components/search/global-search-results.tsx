"use client";

import { motion } from "motion/react";
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
		<motion.div
			className="space-y-8"
			initial="hidden"
			animate="show"
			transition={{ staggerChildren: 0.1 }}
		>
			{hasAnySongs && (
				<motion.div
					variants={{
						hidden: { opacity: 0, y: 20 },
						show: { opacity: 1, y: 0 },
					}}
				>
					<SongsList songs={songs.results} />
					<Separator />
				</motion.div>
			)}
			{hasAnyAlbums && (
				<motion.div
					variants={{
						hidden: { opacity: 0, y: 20 },
						show: { opacity: 1, y: 0 },
					}}
				>
					<AlbumsList albums={albums.results} />
					<Separator />
				</motion.div>
			)}
			{hasAnyArtists && (
				<motion.div
					variants={{
						hidden: { opacity: 0, y: 20 },
						show: { opacity: 1, y: 0 },
					}}
				>
					<ArtistsList artists={artists.results} />
					<Separator />
				</motion.div>
			)}
			{hasAnyPlaylists && (
				<motion.div
					variants={{
						hidden: { opacity: 0, y: 20 },
						show: { opacity: 1, y: 0 },
					}}
				>
					<PlaylistsList playlists={playlists.results} />
				</motion.div>
			)}
		</motion.div>
	);
});
