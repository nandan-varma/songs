import type { UseQueryOptions } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
	albumQueryOptions,
	artistAlbumsQueryOptions,
	artistQueryOptions,
	artistRadioQueryOptions,
	artistSongsQueryOptions,
	chartsQueryOptions,
	globalSearchQueryOptions,
	playlistQueryOptions,
	radioFeaturedQueryOptions,
	radioStationsQueryOptions,
	searchAlbumsQueryOptions,
	searchArtistsQueryOptions,
	searchPlaylistsQueryOptions,
	searchSongsQueryOptions,
	songLyricsQueryOptions,
	songQueryOptions,
	songSuggestionsQueryOptions,
	songsQueryOptions,
	trendingQueryOptions,
} from "@/lib/queries/music";
import type {
	AlbumSearchResult,
	ArtistSearchResult,
	Chart,
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
	DetailedSong,
	Lyrics,
	PlaylistSearchResult,
	RadioStation,
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

export function useGlobalSearch(
	query: string,
	options?: QueryHookOptions<SearchResponse>,
) {
	return useConfiguredQuery(
		globalSearchQueryOptions(query) as UseQueryOptions<
			SearchResponse,
			Error,
			SearchResponse
		>,
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
			Error,
			{ total: number; results: DetailedSong[] }
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
			Error,
			{ total: number; results: AlbumSearchResult[] }
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
			Error,
			{ total: number; results: ArtistSearchResult[] }
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
			Error,
			{ total: number; results: PlaylistSearchResult[] }
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
			Error,
			DetailedSong[]
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
			Error,
			{ total: number; songs: DetailedSong[] }
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
			Error,
			{ total: number; albums: DetailedAlbum[] }
		>,
		!!id && options?.enabled !== false,
		options,
	);
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
 * Hook to fetch algorithmic radio for a specific artist
 */
export function useArtistRadio(
	id: string,
	limit = 20,
	options?: QueryHookOptions<DetailedSong[]>,
) {
	return useConfiguredQuery(
		artistRadioQueryOptions(id, limit) as UseQueryOptions<
			DetailedSong[],
			Error,
			DetailedSong[]
		>,
		!!id && options?.enabled !== false,
		options,
	);
}

/**
 * Hook to fetch trending content for a given type and language
 */
export function useTrending(
	type: "song" | "album" | "playlist",
	language: string,
	options?: QueryHookOptions<DetailedSong[]>,
) {
	return useConfiguredQuery(
		trendingQueryOptions(type, language) as UseQueryOptions<
			DetailedSong[],
			Error,
			DetailedSong[]
		>,
		!!language && options?.enabled !== false,
		options,
	);
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

/**
 * Hook to fetch known featured radio stations
 */
export function useRadioStations(options?: QueryHookOptions<RadioStation[]>) {
	return useConfiguredQuery(
		radioStationsQueryOptions() as UseQueryOptions<
			RadioStation[],
			Error,
			RadioStation[]
		>,
		options?.enabled !== false,
		options,
	);
}

/**
 * Hook to fetch songs from a featured radio station
 */
export function useRadioFeatured(
	name: string,
	language: string,
	limit = 20,
	options?: QueryHookOptions<DetailedSong[]>,
) {
	return useConfiguredQuery(
		radioFeaturedQueryOptions(name, language, limit) as UseQueryOptions<
			DetailedSong[],
			Error,
			DetailedSong[]
		>,
		!!name && options?.enabled !== false,
		options,
	);
}
