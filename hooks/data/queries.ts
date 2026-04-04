import type { UseQueryOptions } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
	getAlbumById,
	getArtistAlbums,
	getArtistById,
	getArtistSongs,
	getPlaylistById,
	getSongById,
	getSongSuggestions,
	searchAlbums,
	searchArtists,
	searchMusic,
	searchPlaylists,
	searchSongs,
} from "@/lib/api";
import { CACHE_KEYS, CACHE_TIMES } from "@/lib/cache";
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

function useEntityQuery<T>(
	queryKey: readonly unknown[],
	queryFn: () => Promise<T>,
	staleTime: number,
	enabled: boolean,
	options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey,
		queryFn,
		staleTime,
		enabled,
		...options,
	});
}

export function useSong(
	id: string,
	options?: Omit<UseQueryOptions<DetailedSong[]>, "queryKey" | "queryFn"> & {
		enabled?: boolean;
	},
) {
	return useEntityQuery(
		CACHE_KEYS.SONGS(id),
		() => getSongById(id),
		CACHE_TIMES.SONG,
		!!id && options?.enabled !== false,
		options,
	);
}

export function useAlbum(
	id: string,
	options?: Omit<UseQueryOptions<DetailedAlbum>, "queryKey" | "queryFn"> & {
		enabled?: boolean;
	},
) {
	return useEntityQuery(
		CACHE_KEYS.ALBUM(id),
		() => getAlbumById(id),
		CACHE_TIMES.ALBUM,
		!!id && options?.enabled !== false,
		options,
	);
}

export function useArtist(
	id: string,
	options?: Omit<UseQueryOptions<DetailedArtist>, "queryKey" | "queryFn"> & {
		enabled?: boolean;
	},
) {
	return useEntityQuery(
		CACHE_KEYS.ARTIST(id),
		() => getArtistById(id),
		CACHE_TIMES.ARTIST,
		!!id && options?.enabled !== false,
		options,
	);
}

export function usePlaylist(
	id: string,
	options?: Omit<UseQueryOptions<DetailedPlaylist>, "queryKey" | "queryFn"> & {
		enabled?: boolean;
	},
) {
	return useEntityQuery(
		CACHE_KEYS.PLAYLIST(id),
		() => getPlaylistById(id),
		CACHE_TIMES.ALBUM,
		!!id && options?.enabled !== false,
		options,
	);
}

export function useGlobalSearch(
	query: string,
	options?: Omit<UseQueryOptions<SearchResponse>, "queryKey" | "queryFn"> & {
		enabled?: boolean;
	},
) {
	return useEntityQuery(
		CACHE_KEYS.SEARCH(query),
		() => searchMusic(query),
		CACHE_TIMES.SEARCH,
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
	options?: Omit<
		UseQueryOptions<{ total: number; results: DetailedSong[] }>,
		"queryKey" | "queryFn"
	> & {
		enabled?: boolean;
	},
) {
	return useEntityQuery(
		["search-songs", query, limit],
		() => searchSongs(query, 0, limit),
		CACHE_TIMES.SEARCH,
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
	options?: Omit<
		UseQueryOptions<{ total: number; results: AlbumSearchResult[] }>,
		"queryKey" | "queryFn"
	> & {
		enabled?: boolean;
	},
) {
	return useEntityQuery(
		["search-albums", query, limit],
		() => searchAlbums(query, 0, limit),
		CACHE_TIMES.SEARCH,
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
	options?: Omit<
		UseQueryOptions<{ total: number; results: ArtistSearchResult[] }>,
		"queryKey" | "queryFn"
	> & {
		enabled?: boolean;
	},
) {
	return useEntityQuery(
		["search-artists", query, limit],
		() => searchArtists(query, 0, limit),
		CACHE_TIMES.SEARCH,
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
	options?: Omit<
		UseQueryOptions<{ total: number; results: PlaylistSearchResult[] }>,
		"queryKey" | "queryFn"
	> & {
		enabled?: boolean;
	},
) {
	return useEntityQuery(
		["search-playlists", query, limit],
		() => searchPlaylists(query, 0, limit),
		CACHE_TIMES.SEARCH,
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
	options?: Omit<UseQueryOptions<DetailedSong[]>, "queryKey" | "queryFn"> & {
		enabled?: boolean;
	},
) {
	return useEntityQuery(
		["suggestions", id, limit],
		() => getSongSuggestions(id, limit),
		CACHE_TIMES.SONG,
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
	options?: Omit<
		UseQueryOptions<{ total: number; songs: DetailedSong[] }>,
		"queryKey" | "queryFn"
	> & {
		enabled?: boolean;
	},
) {
	return useEntityQuery(
		["artist-songs", id, sortBy, sortOrder],
		() => getArtistSongs(id, 0, sortBy, sortOrder),
		CACHE_TIMES.ARTIST,
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
	options?: Omit<
		UseQueryOptions<{ total: number; albums: DetailedAlbum[] }>,
		"queryKey" | "queryFn"
	> & {
		enabled?: boolean;
	},
) {
	return useEntityQuery(
		["artist-albums", id, sortBy, sortOrder],
		() => getArtistAlbums(id, 0, sortBy, sortOrder),
		CACHE_TIMES.ARTIST,
		!!id && options?.enabled !== false,
		options,
	);
}
