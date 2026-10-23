/**
 * Parallel Search Queries Orchestration Hook
 * Fetches songs/albums/artists/playlists in parallel, each with its own pagination
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import {
	searchAlbumsQueryOptions,
	searchArtistsQueryOptions,
	searchPlaylistsQueryOptions,
	searchSongsQueryOptions,
} from "@/lib/queries/music";
import type {
	AlbumSearchResult,
	ArtistSearchResult,
	DetailedSong,
	PlaylistSearchResult,
} from "@/types/api";

export interface SearchSection<T> {
	results: T[];
	total: number;
	isLoading: boolean;
	error: Error | null;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	fetchNextPage: () => void;
}

export interface SearchResult {
	songs: SearchSection<DetailedSong>;
	albums: SearchSection<AlbumSearchResult>;
	artists: SearchSection<ArtistSearchResult>;
	playlists: SearchSection<PlaylistSearchResult>;
	isLoading: boolean;
	isError: boolean;
}

export interface UseSearchQueriesOptions {
	/** Page size per category */
	limit?: number;
	/** Enable/disable queries */
	enabled?: boolean;
}

interface InfiniteSearchQuery<T> {
	data: { pages: { total: number; results: T[] }[] } | undefined;
	isPending: boolean;
	error: Error | null;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	fetchNextPage: () => unknown;
}

/** Flattens loaded pages; upstream pages can overlap, so repeats are dropped. */
function toSection<T extends { id: string }>(
	query: InfiniteSearchQuery<T>,
): SearchSection<T> {
	const seen = new Set<string>();
	const results: T[] = [];
	for (const page of query.data?.pages ?? []) {
		for (const item of page.results) {
			if (seen.has(item.id)) continue;
			seen.add(item.id);
			results.push(item);
		}
	}

	return {
		results,
		total: query.data?.pages[0]?.total ?? 0,
		isLoading: query.isPending,
		error: query.error,
		hasNextPage: query.hasNextPage,
		isFetchingNextPage: query.isFetchingNextPage,
		fetchNextPage: () => {
			void query.fetchNextPage();
		},
	};
}

/**
 * Hook to fetch search results for all entity types in parallel
 *
 * @param query - Search query string
 * @param options - Query options
 * @returns Combined, paginated search results for all entity types
 */
export function useSearchQueries(
	query: string,
	options?: UseSearchQueriesOptions,
): SearchResult {
	const limit = options?.limit ?? 10;
	const enabled = options?.enabled !== false && !!query;

	const songs = useInfiniteQuery({
		...searchSongsQueryOptions(query, limit),
		enabled,
	});
	const albums = useInfiniteQuery({
		...searchAlbumsQueryOptions(query, limit),
		enabled,
	});
	const artists = useInfiniteQuery({
		...searchArtistsQueryOptions(query, limit),
		enabled,
	});
	const playlists = useInfiniteQuery({
		...searchPlaylistsQueryOptions(query, limit),
		enabled,
	});

	return {
		songs: toSection(songs),
		albums: toSection(albums),
		artists: toSection(artists),
		playlists: toSection(playlists),
		isLoading: [songs, albums, artists, playlists].some((q) => q.isPending),
		isError: [songs, albums, artists, playlists].some((q) => q.isError),
	};
}
