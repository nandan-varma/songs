import type { UseQueryOptions } from "@tanstack/react-query";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
	type ArtistSortBy,
	type ArtistSortOrder,
	albumQueryOptions,
	artistAlbumsQueryOptions,
	artistQueryOptions,
	artistSongsQueryOptions,
	chartsQueryOptions,
	playlistQueryOptions,
	songLyricsQueryOptions,
	songQueryOptions,
	songSuggestionsQueryOptions,
	songsQueryOptions,
	trendingQueryOptions,
} from "@/lib/queries/music";
import type {
	Chart,
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
	DetailedSong,
	Lyrics,
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
		...(options as QueryHookOptions<T> | undefined),
		enabled,
	});
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
		songsQueryOptions(ids) as UseQueryOptions<
			DetailedSong[],
			Error,
			DetailedSong[]
		>,
		ids.length > 0 && options?.enabled !== false,
		options,
	);
}

export function useAlbum(
	id: string,
	options?: QueryHookOptions<DetailedAlbum>,
) {
	return useConfiguredQuery(
		albumQueryOptions(id) as UseQueryOptions<
			DetailedAlbum,
			Error,
			DetailedAlbum
		>,
		!!id && options?.enabled !== false,
		options,
	);
}

export function useArtist(
	id: string,
	options?: QueryHookOptions<DetailedArtist>,
) {
	return useConfiguredQuery(
		artistQueryOptions(id) as UseQueryOptions<
			DetailedArtist,
			Error,
			DetailedArtist
		>,
		!!id && options?.enabled !== false,
		options,
	);
}

export function usePlaylist(
	id: string,
	options?: QueryHookOptions<DetailedPlaylist>,
) {
	return useConfiguredQuery(
		playlistQueryOptions(id) as UseQueryOptions<
			DetailedPlaylist,
			Error,
			DetailedPlaylist
		>,
		!!id && options?.enabled !== false,
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
			Error,
			DetailedSong[]
		>,
		!!id && options?.enabled !== false,
		options,
	);
}

/**
 * Hook to page through every song by an artist with sorting
 */
export function useArtistSongs(
	id: string,
	sortBy: ArtistSortBy = "popularity",
	sortOrder: ArtistSortOrder = "desc",
	options?: { enabled?: boolean },
) {
	return useInfiniteQuery({
		...artistSongsQueryOptions(id, sortBy, sortOrder),
		enabled: !!id && options?.enabled !== false,
	});
}

/**
 * Hook to page through every album by an artist with sorting
 */
export function useArtistAlbums(
	id: string,
	sortBy: ArtistSortBy = "popularity",
	sortOrder: ArtistSortOrder = "desc",
	options?: { enabled?: boolean },
) {
	return useInfiniteQuery({
		...artistAlbumsQueryOptions(id, sortBy, sortOrder),
		enabled: !!id && options?.enabled !== false,
	});
}

/**
 * Hook to fetch lyrics for a song
 */
export function useSongLyrics(id: string, options?: QueryHookOptions<Lyrics>) {
	return useConfiguredQuery(
		songLyricsQueryOptions(id) as UseQueryOptions<Lyrics, Error, Lyrics>,
		!!id && options?.enabled !== false,
		options,
	);
}

/**
 * Hook to fetch trending content for a given type and language
 */
export function useTrending<K extends "song" | "album" | "playlist">(
	type: K,
	language: string,
	options?: { enabled?: boolean },
) {
	return useQuery({
		...trendingQueryOptions(type, language),
		enabled: !!language && options?.enabled !== false,
	});
}

/**
 * Hook to fetch editorial charts
 */
export function useCharts(options?: QueryHookOptions<Chart[]>) {
	return useConfiguredQuery(
		chartsQueryOptions() as UseQueryOptions<Chart[], Error, Chart[]>,
		options?.enabled !== false,
		options,
	);
}
