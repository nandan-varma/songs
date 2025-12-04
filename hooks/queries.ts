import {
	type UseInfiniteQueryOptions,
	type UseQueryOptions,
	useInfiniteQuery,
	useQuery,
} from "@tanstack/react-query";
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
import type {
	AlbumSearchResult,
	ArtistSearchResult,
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
	DetailedSong,
	PlaylistSearchResult,
	SearchResponse,
} from "@/lib/types";

// Query Keys
export const queryKeys = {
	album: (id: string) => ["album", id] as const,
	playlist: (id: string) => ["playlist", id] as const,
	song: (id: string) => ["song", id] as const,
	songSuggestions: (id: string, limit: number) =>
		["song-suggestions", id, limit] as const,
	artist: (
		id: string,
		page: number,
		songCount: number,
		albumCount: number,
		sortBy: string,
		sortOrder: string,
	) => ["artist", id, page, songCount, albumCount, sortBy, sortOrder] as const,
	artistSongs: (id: string, sortBy: string, sortOrder: string) =>
		["artist-songs", id, sortBy, sortOrder] as const,
	artistAlbums: (id: string, sortBy: string, sortOrder: string) =>
		["artist-albums", id, sortBy, sortOrder] as const,
	searchSongs: (query: string) => ["search-songs", query] as const,
	searchAlbums: (query: string) => ["search-albums", query] as const,
	searchArtists: (query: string) => ["search-artists", query] as const,
	searchPlaylists: (query: string) => ["search-playlists", query] as const,
	globalSearch: (query: string) => ["global-search", query] as const,
};

// Core entity hooks
export function useAlbum(
	id: string,
	options?: Omit<UseQueryOptions<DetailedAlbum>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: queryKeys.album(id),
		queryFn: async () => {
			const response = await getAlbumById(id);
			return response.data;
		},
		staleTime: 1000 * 60 * 10, // 10 minutes - album data rarely changes
		...options,
	});
}

export function usePlaylist(
	id: string,
	options?: Omit<UseQueryOptions<DetailedPlaylist>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: queryKeys.playlist(id),
		queryFn: async () => {
			const response = await getPlaylistById(id);
			return response.data;
		},
		staleTime: 1000 * 60 * 5, // 5 minutes - playlists may update occasionally
		...options,
	});
}

export function useSong(
	id: string,
	options?: Omit<UseQueryOptions<DetailedSong[]>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: queryKeys.song(id),
		queryFn: async () => {
			const response = await getSongById(id);
			return response.data;
		},
		staleTime: 1000 * 60 * 10, // 10 minutes - song metadata rarely changes
		...options,
	});
}

export function useSongSuggestions(
	id: string,
	limit = 10,
	options?: Omit<UseQueryOptions<DetailedSong[]>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: queryKeys.songSuggestions(id, limit),
		queryFn: async () => {
			const response = await getSongSuggestions(id, limit);
			return response.data;
		},
		staleTime: 1000 * 60 * 5, // 5 minutes - suggestions can change
		...options,
	});
}

export function useArtist(
	id: string,
	options?: {
		page?: number;
		songCount?: number;
		albumCount?: number;
		sortBy?: "popularity" | "latest" | "alphabetical";
		sortOrder?: "asc" | "desc";
		queryOptions?: Omit<
			UseQueryOptions<DetailedArtist>,
			"queryKey" | "queryFn"
		>;
	},
) {
	const {
		page = 1,
		songCount = 10,
		albumCount = 10,
		sortBy = "popularity",
		sortOrder = "desc",
		queryOptions,
	} = options || {};

	return useQuery({
		queryKey: queryKeys.artist(
			id,
			page,
			songCount,
			albumCount,
			sortBy,
			sortOrder,
		),
		queryFn: async () => {
			const response = await getArtistById(id, {
				page,
				songCount,
				albumCount,
				sortBy,
				sortOrder,
			});
			return response.data;
		},
		staleTime: 1000 * 60 * 10, // 10 minutes - artist data rarely changes
		...queryOptions,
	});
}

// Infinite query hooks for pagination
export function useArtistSongs(
	id: string,
	sortBy: "popularity" | "latest" | "alphabetical" = "popularity",
	sortOrder: "asc" | "desc" = "desc",
	options?: Omit<
		UseInfiniteQueryOptions<
			{ total: number; songs: DetailedSong[] },
			Error,
			{ total: number; songs: DetailedSong[] },
			readonly [string, string, string, string],
			number
		>,
		"queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
	>,
) {
	return useInfiniteQuery({
		queryKey: queryKeys.artistSongs(id, sortBy, sortOrder),
		queryFn: async ({ pageParam }) => {
			const response = await getArtistSongs(id, pageParam, sortBy, sortOrder);
			return response.data;
		},
		getNextPageParam: (lastPage, allPages) => {
			const currentTotal = allPages.reduce(
				(sum, page) => sum + page.songs.length,
				0,
			);
			return currentTotal < lastPage.total ? allPages.length + 1 : undefined;
		},
		initialPageParam: 0,
		staleTime: 1000 * 60 * 5, // 5 minutes
		...options,
	});
}

export function useArtistAlbums(
	id: string,
	sortBy: "popularity" | "latest" | "alphabetical" = "popularity",
	sortOrder: "asc" | "desc" = "desc",
	options?: Omit<
		UseInfiniteQueryOptions<
			{ total: number; albums: DetailedAlbum[] },
			Error,
			{ total: number; albums: DetailedAlbum[] },
			readonly [string, string, string, string],
			number
		>,
		"queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
	>,
) {
	return useInfiniteQuery({
		queryKey: queryKeys.artistAlbums(id, sortBy, sortOrder),
		queryFn: async ({ pageParam }) => {
			const response = await getArtistAlbums(id, pageParam, sortBy, sortOrder);
			return response.data;
		},
		getNextPageParam: (lastPage, allPages) => {
			const currentTotal = allPages.reduce(
				(sum, page) => sum + page.albums.length,
				0,
			);
			return currentTotal < lastPage.total ? allPages.length + 1 : undefined;
		},
		initialPageParam: 0,
		staleTime: 1000 * 60 * 5, // 5 minutes
		...options,
	});
}

// Search hooks with infinite queries
export function useSearchSongs(
	query: string,
	limit = 20,
	options?: Omit<
		UseInfiniteQueryOptions<
			{ total: number; results: DetailedSong[] },
			Error,
			{ total: number; results: DetailedSong[] },
			readonly [string, string],
			number
		>,
		"queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
	>,
) {
	return useInfiniteQuery({
		queryKey: queryKeys.searchSongs(query),
		queryFn: async ({ pageParam }) => {
			const response = await searchSongs(query, pageParam, limit);
			return response.data;
		},
		getNextPageParam: (lastPage, allPages) => {
			const currentTotal = allPages.reduce(
				(sum, page) => sum + page.results.length,
				0,
			);
			return currentTotal < lastPage.total ? allPages.length + 1 : undefined;
		},
		initialPageParam: 0,
		enabled: query.length > 0,
		staleTime: 1000 * 60, // 1 minute - search results can change
		...options,
	});
}

export function useSearchAlbums(
	query: string,
	limit = 20,
	options?: Omit<
		UseInfiniteQueryOptions<
			{ total: number; results: AlbumSearchResult[] },
			Error,
			{ total: number; results: AlbumSearchResult[] },
			readonly [string, string],
			number
		>,
		"queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
	>,
) {
	return useInfiniteQuery({
		queryKey: queryKeys.searchAlbums(query),
		queryFn: async ({ pageParam }) => {
			const response = await searchAlbums(query, pageParam, limit);
			return response.data;
		},
		getNextPageParam: (lastPage, allPages) => {
			const currentTotal = allPages.reduce(
				(sum, page) => sum + page.results.length,
				0,
			);
			return currentTotal < lastPage.total ? allPages.length + 1 : undefined;
		},
		initialPageParam: 0,
		enabled: query.length > 0,
		staleTime: 1000 * 60, // 1 minute
		...options,
	});
}

export function useSearchArtists(
	query: string,
	limit = 20,
	options?: Omit<
		UseInfiniteQueryOptions<
			{ total: number; results: ArtistSearchResult[] },
			Error,
			{ total: number; results: ArtistSearchResult[] },
			readonly [string, string],
			number
		>,
		"queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
	>,
) {
	return useInfiniteQuery({
		queryKey: queryKeys.searchArtists(query),
		queryFn: async ({ pageParam }) => {
			const response = await searchArtists(query, pageParam, limit);
			return response.data;
		},
		getNextPageParam: (lastPage, allPages) => {
			const currentTotal = allPages.reduce(
				(sum, page) => sum + page.results.length,
				0,
			);
			return currentTotal < lastPage.total ? allPages.length + 1 : undefined;
		},
		initialPageParam: 0,
		enabled: query.length > 0,
		staleTime: 1000 * 60, // 1 minute
		...options,
	});
}

export function useSearchPlaylists(
	query: string,
	limit = 20,
	options?: Omit<
		UseInfiniteQueryOptions<
			{ total: number; results: PlaylistSearchResult[] },
			Error,
			{ total: number; results: PlaylistSearchResult[] },
			readonly [string, string],
			number
		>,
		"queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
	>,
) {
	return useInfiniteQuery({
		queryKey: queryKeys.searchPlaylists(query),
		queryFn: async ({ pageParam }) => {
			const response = await searchPlaylists(query, pageParam, limit);
			return response.data;
		},
		getNextPageParam: (lastPage, allPages) => {
			const currentTotal = allPages.reduce(
				(sum, page) => sum + page.results.length,
				0,
			);
			return currentTotal < lastPage.total ? allPages.length + 1 : undefined;
		},
		initialPageParam: 0,
		enabled: query.length > 0,
		staleTime: 1000 * 60, // 1 minute
		...options,
	});
}

// Global search hook (not paginated)
export function useGlobalSearch(
	query: string,
	options?: Omit<UseQueryOptions<SearchResponse>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: queryKeys.globalSearch(query),
		queryFn: async () => {
			return await searchMusic(query);
		},
		enabled: query.length > 0,
		staleTime: 1000 * 60, // 1 minute
		...options,
	});
}
