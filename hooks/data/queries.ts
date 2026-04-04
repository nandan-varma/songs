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
import { unwrapApiResponse } from "@/lib/api/unwrap-response";
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

/**
 * Hook to fetch a single song by ID
 */
export function useSong(
	id: string,
	options?: Omit<UseQueryOptions<DetailedSong[]>, "queryKey" | "queryFn"> & {
		enabled?: boolean;
	},
) {
	return useQuery({
		queryKey: CACHE_KEYS.SONGS(id),
		queryFn: async () => {
			const response = await getSongById(id);
			return unwrapApiResponse(response);
		},
		enabled: !!id && options?.enabled !== false,
		staleTime: CACHE_TIMES.SONG,
		...options,
	});
}

/**
 * Hook to fetch a single album by ID
 */
export function useAlbum(
	id: string,
	options?: Omit<UseQueryOptions<DetailedAlbum>, "queryKey" | "queryFn"> & {
		enabled?: boolean;
	},
) {
	return useQuery({
		queryKey: CACHE_KEYS.ALBUM(id),
		queryFn: async () => {
			const response = await getAlbumById(id);
			return unwrapApiResponse(response);
		},
		enabled: !!id && options?.enabled !== false,
		staleTime: CACHE_TIMES.ALBUM,
		...options,
	});
}

/**
 * Hook to fetch a single artist by ID
 */
export function useArtist(
	id: string,
	options?: Omit<UseQueryOptions<DetailedArtist>, "queryKey" | "queryFn"> & {
		enabled?: boolean;
	},
) {
	return useQuery({
		queryKey: CACHE_KEYS.ARTIST(id),
		queryFn: async () => {
			const response = await getArtistById(id);
			return unwrapApiResponse(response);
		},
		enabled: !!id && options?.enabled !== false,
		staleTime: CACHE_TIMES.ARTIST,
		...options,
	});
}

/**
 * Hook to fetch a single playlist by ID
 */
export function usePlaylist(
	id: string,
	options?: Omit<UseQueryOptions<DetailedPlaylist>, "queryKey" | "queryFn"> & {
		enabled?: boolean;
	},
) {
	return useQuery({
		queryKey: CACHE_KEYS.PLAYLIST(id),
		queryFn: async () => {
			const response = await getPlaylistById(id);
			return unwrapApiResponse(response);
		},
		enabled: !!id && options?.enabled !== false,
		staleTime: CACHE_TIMES.ALBUM, // Playlists have similar TTL to albums
		...options,
	});
}

/**
 * Hook to fetch global search results across all content types
 */
export function useGlobalSearch(
	query: string,
	options?: Omit<UseQueryOptions<SearchResponse>, "queryKey" | "queryFn"> & {
		enabled?: boolean;
	},
) {
	return useQuery({
		queryKey: CACHE_KEYS.SEARCH(query),
		queryFn: () => searchMusic(query),
		enabled: !!query && options?.enabled !== false,
		staleTime: CACHE_TIMES.SEARCH,
		...options,
	});
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
	return useQuery({
		queryKey: ["search-songs", query, limit],
		queryFn: async () => {
			const response = await searchSongs(query, 0, limit);
			return unwrapApiResponse(response);
		},
		enabled: !!query && options?.enabled !== false,
		staleTime: CACHE_TIMES.SEARCH,
		...options,
	});
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
	return useQuery({
		queryKey: ["search-albums", query, limit],
		queryFn: async () => {
			const response = await searchAlbums(query, 0, limit);
			return unwrapApiResponse(response);
		},
		enabled: !!query && options?.enabled !== false,
		staleTime: CACHE_TIMES.SEARCH,
		...options,
	});
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
	return useQuery({
		queryKey: ["search-artists", query, limit],
		queryFn: async () => {
			const response = await searchArtists(query, 0, limit);
			return unwrapApiResponse(response);
		},
		enabled: !!query && options?.enabled !== false,
		staleTime: CACHE_TIMES.SEARCH,
		...options,
	});
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
	return useQuery({
		queryKey: ["search-playlists", query, limit],
		queryFn: async () => {
			const response = await searchPlaylists(query, 0, limit);
			return unwrapApiResponse(response);
		},
		enabled: !!query && options?.enabled !== false,
		staleTime: CACHE_TIMES.SEARCH,
		...options,
	});
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
	return useQuery({
		queryKey: ["suggestions", id, limit],
		queryFn: async () => {
			const response = await getSongSuggestions(id, limit);
			return unwrapApiResponse(response);
		},
		enabled: !!id && options?.enabled !== false,
		staleTime: CACHE_TIMES.SONG,
		...options,
	});
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
	return useQuery({
		queryKey: ["artist-songs", id, sortBy, sortOrder],
		queryFn: async () => {
			const response = await getArtistSongs(id, 0, sortBy, sortOrder);
			return unwrapApiResponse(response);
		},
		enabled: !!id && options?.enabled !== false,
		staleTime: CACHE_TIMES.ARTIST,
		...options,
	});
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
	return useQuery({
		queryKey: ["artist-albums", id, sortBy, sortOrder],
		queryFn: async () => {
			const response = await getArtistAlbums(id, 0, sortBy, sortOrder);
			return unwrapApiResponse(response);
		},
		enabled: !!id && options?.enabled !== false,
		staleTime: CACHE_TIMES.ARTIST,
		...options,
	});
}
