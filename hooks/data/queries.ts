"use client";

import type { UseQueryOptions } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
	albumQueryOptions,
	artistAlbumsQueryOptions,
	artistQueryOptions,
	artistSongsQueryOptions,
	globalSearchQueryOptions,
	playlistQueryOptions,
	searchAlbumsQueryOptions,
	searchArtistsQueryOptions,
	searchPlaylistsQueryOptions,
	searchSongsQueryOptions,
	songQueryOptions,
	songSuggestionsQueryOptions,
	songsQueryOptions,
} from "@/lib/queries/music";
import type {
	AlbumSearchResult,
	ArtistSearchResult,
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
	DetailedSong,
	PlaylistSearchResult,
	SearchResponse,
} from "@/types/api";

type QueryHookOptions<T> = Omit<
	UseQueryOptions<T, Error, T>,
	"queryKey" | "queryFn"
> & {
	enabled?: boolean;
};

function useConfiguredQuery<T>(
	baseOptions: UseQueryOptions<T, Error, T>,
	enabled: boolean,
	options?: QueryHookOptions<T>,
) {
	return useQuery({
		...baseOptions,
		enabled,
		...options,
	} as UseQueryOptions<T, Error, T>);
}

export function useSong(
	id: string,
	options?: QueryHookOptions<DetailedSong[]>,
) {
	return useConfiguredQuery(
		songQueryOptions(id) as UseQueryOptions<
			DetailedSong[],
			Error,
			DetailedSong[]
		>,
		!!id && options?.enabled !== false,
		options,
	);
}

export function useSongs(
	ids: string[],
	options?: QueryHookOptions<DetailedSong[]>,
) {
	return useConfiguredQuery(
		songsQueryOptions(ids) as UseQueryOptions<DetailedSong[], Error>,
		ids.length > 0 && options?.enabled !== false,
		options,
	);
}

export function useAlbum(
	id: string,
	options?: QueryHookOptions<DetailedAlbum>,
) {
	return useConfiguredQuery(
		albumQueryOptions(id) as UseQueryOptions<DetailedAlbum, Error>,
		!!id && options?.enabled !== false,
		options,
	);
}

export function useArtist(
	id: string,
	options?: QueryHookOptions<DetailedArtist>,
) {
	return useConfiguredQuery(
		artistQueryOptions(id) as UseQueryOptions<DetailedArtist, Error>,
		!!id && options?.enabled !== false,
		options,
	);
}

export function usePlaylist(
	id: string,
	options?: QueryHookOptions<DetailedPlaylist>,
) {
	return useConfiguredQuery(
		playlistQueryOptions(id) as UseQueryOptions<DetailedPlaylist, Error>,
		!!id && options?.enabled !== false,
		options,
	);
}

export function useGlobalSearch(
	query: string,
	options?: QueryHookOptions<SearchResponse>,
) {
	return useConfiguredQuery(
		globalSearchQueryOptions(query) as UseQueryOptions<SearchResponse, Error>,
		!!query && options?.enabled !== false,
		options,
	);
}

/**
 * Hook to fetch songs by search query
 */
export function useSearchSongs(
	query: string,
	limit = 10,
	options?: QueryHookOptions<{ total: number; results: DetailedSong[] }>,
) {
	return useConfiguredQuery(
		searchSongsQueryOptions(query, limit) as UseQueryOptions<
			{ total: number; results: DetailedSong[] },
			Error
		>,
		!!query && options?.enabled !== false,
		options,
	);
}

/**
 * Hook to fetch albums by search query
 */
export function useSearchAlbums(
	query: string,
	limit = 10,
	options?: QueryHookOptions<{ total: number; results: AlbumSearchResult[] }>,
) {
	return useConfiguredQuery(
		searchAlbumsQueryOptions(query, limit) as UseQueryOptions<
			{ total: number; results: AlbumSearchResult[] },
			Error
		>,
		!!query && options?.enabled !== false,
		options,
	);
}

/**
 * Hook to fetch artists by search query
 */
export function useSearchArtists(
	query: string,
	limit = 10,
	options?: QueryHookOptions<{ total: number; results: ArtistSearchResult[] }>,
) {
	return useConfiguredQuery(
		searchArtistsQueryOptions(query, limit) as UseQueryOptions<
			{ total: number; results: ArtistSearchResult[] },
			Error
		>,
		!!query && options?.enabled !== false,
		options,
	);
}

/**
 * Hook to fetch playlists by search query
 */
export function useSearchPlaylists(
	query: string,
	limit = 10,
	options?: QueryHookOptions<{
		total: number;
		results: PlaylistSearchResult[];
	}>,
) {
	return useConfiguredQuery(
		searchPlaylistsQueryOptions(query, limit) as UseQueryOptions<
			{ total: number; results: PlaylistSearchResult[] },
			Error
		>,
		!!query && options?.enabled !== false,
		options,
	);
}

/**
 * Hook to fetch suggested songs based on a song ID
 */
export function useSongSuggestions(
	id: string,
	limit = 10,
	options?: QueryHookOptions<DetailedSong[]>,
) {
	return useConfiguredQuery(
		songSuggestionsQueryOptions(id, limit) as UseQueryOptions<
			DetailedSong[],
			Error
		>,
		!!id && options?.enabled !== false,
		options,
	);
}

/**
 * Hook to fetch songs by a specific artist with sorting
 */
export function useArtistSongs(
	id: string,
	sortBy: "popularity" | "latest" | "alphabetical" = "popularity",
	sortOrder: "asc" | "desc" = "desc",
	options?: QueryHookOptions<{ total: number; songs: DetailedSong[] }>,
) {
	return useConfiguredQuery(
		artistSongsQueryOptions(id, sortBy, sortOrder) as UseQueryOptions<
			{ total: number; songs: DetailedSong[] },
			Error
		>,
		!!id && options?.enabled !== false,
		options,
	);
}

/**
 * Hook to fetch albums by a specific artist with sorting
 */
export function useArtistAlbums(
	id: string,
	sortBy: "popularity" | "latest" | "alphabetical" = "popularity",
	sortOrder: "asc" | "desc" = "desc",
	options?: QueryHookOptions<{ total: number; albums: DetailedAlbum[] }>,
) {
	return useConfiguredQuery(
		artistAlbumsQueryOptions(id, sortBy, sortOrder) as UseQueryOptions<
			{ total: number; albums: DetailedAlbum[] },
			Error
		>,
		!!id && options?.enabled !== false,
		options,
	);
}
