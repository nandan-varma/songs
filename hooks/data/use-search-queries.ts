/**
 * Parallel Search Queries Orchestration Hook
 * Fetches songs/albums/artists/playlists in parallel
 * Replaces: search-content.tsx lines 40-90 (duplicated query calls)
 */

import { useQueries } from "@tanstack/react-query";
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

export interface SearchResult {
	songs: {
		results: DetailedSong[];
		total: number;
		isLoading: boolean;
		error: Error | null;
	};
	albums: {
		results: AlbumSearchResult[];
		total: number;
		isLoading: boolean;
		error: Error | null;
	};
	artists: {
		results: ArtistSearchResult[];
		total: number;
		isLoading: boolean;
		error: Error | null;
	};
	playlists: {
		results: PlaylistSearchResult[];
		total: number;
		isLoading: boolean;
		error: Error | null;
	};
}

export interface UseSearchQueriesOptions {
	/** Limit results per category */
	limit?: number;
	/** Enable/disable queries */
	enabled?: boolean;
}

/**
 * Hook to fetch search results for all entity types in parallel
 * Orchestrates 4 queries with efficient batching
 *
 * @param query - Search query string
 * @param options - Query options
 * @returns Combined search results for all entity types
 *
 * @example
 * const { songs, albums, artists, playlists } = useSearchQueries("Taylor Swift", {
 *   limit: 10,
 *   enabled: query.length > 2,
 * });
 */
export function useSearchQueries(
	query: string,
	options?: UseSearchQueriesOptions,
) {
	const limit = options?.limit ?? 10;
	const enabled = options?.enabled !== false && !!query;

	const results = useQueries({
		queries: [
			{
				...searchSongsQueryOptions(query, limit),
				enabled,
			},
			{
				...searchAlbumsQueryOptions(query, limit),
				enabled,
			},
			{
				...searchArtistsQueryOptions(query, limit),
				enabled,
			},
			{
				...searchPlaylistsQueryOptions(query, limit),
				enabled,
			},
		],
	});

	return {
		songs: {
			results: results[0].data?.results ?? [],
			total: results[0].data?.total ?? 0,
			isLoading: results[0].isPending,
			error: results[0].error,
		},
		albums: {
			results: results[1].data?.results ?? [],
			total: results[1].data?.total ?? 0,
			isLoading: results[1].isPending,
			error: results[1].error,
		},
		artists: {
			results: results[2].data?.results ?? [],
			total: results[2].data?.total ?? 0,
			isLoading: results[2].isPending,
			error: results[2].error,
		},
		playlists: {
			results: results[3].data?.results ?? [],
			total: results[3].data?.total ?? 0,
			isLoading: results[3].isPending,
			error: results[3].error,
		},
		isLoading: results.some((r) => r.isPending),
		isError: results.some((r) => r.isError),
	};
}
