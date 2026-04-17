import { queryOptions } from "@tanstack/react-query";
import {
	getAlbumById,
	getArtistAlbums,
	getArtistById,
	getArtistSongs,
	getPlaylistById,
	getSongById,
	getSongSuggestions,
	getSongsByIds,
	searchAlbums,
	searchArtists,
	searchMusic,
	searchPlaylists,
	searchSongs,
} from "@/lib/api";
import { CACHE_KEYS, CACHE_TIMES } from "@/lib/cache";

export function songQueryOptions(id: string) {
	return queryOptions({
		queryKey: CACHE_KEYS.SONGS(id),
		queryFn: () => getSongById(id),
		staleTime: CACHE_TIMES.SONG,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}

export function songsQueryOptions(ids: string[]) {
	return queryOptions({
		queryKey: CACHE_KEYS.SONGS_BY_IDS(ids),
		queryFn: () => getSongsByIds(ids),
		staleTime: CACHE_TIMES.SONG,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}

export function albumQueryOptions(id: string) {
	return queryOptions({
		queryKey: CACHE_KEYS.ALBUM(id),
		queryFn: () => getAlbumById(id),
		staleTime: CACHE_TIMES.ALBUM,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}

export function artistQueryOptions(id: string) {
	return queryOptions({
		queryKey: CACHE_KEYS.ARTIST(id),
		queryFn: () => getArtistById(id),
		staleTime: CACHE_TIMES.ARTIST,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}

export function playlistQueryOptions(id: string) {
	return queryOptions({
		queryKey: CACHE_KEYS.PLAYLIST(id),
		queryFn: () => getPlaylistById(id),
		staleTime: CACHE_TIMES.ALBUM,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}

export function globalSearchQueryOptions(query: string) {
	return queryOptions({
		queryKey: CACHE_KEYS.SEARCH(query),
		queryFn: () => searchMusic(query),
		staleTime: CACHE_TIMES.SEARCH,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}

export function searchSongsQueryOptions(query: string, limit: number) {
	return queryOptions({
		queryKey: CACHE_KEYS.SEARCH_SONGS(query, limit),
		queryFn: () => searchSongs(query, 0, limit),
		staleTime: CACHE_TIMES.SEARCH,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}

export function searchAlbumsQueryOptions(query: string, limit: number) {
	return queryOptions({
		queryKey: CACHE_KEYS.SEARCH_ALBUMS(query, limit),
		queryFn: () => searchAlbums(query, 0, limit),
		staleTime: CACHE_TIMES.SEARCH,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}

export function searchArtistsQueryOptions(query: string, limit: number) {
	return queryOptions({
		queryKey: CACHE_KEYS.SEARCH_ARTISTS(query, limit),
		queryFn: () => searchArtists(query, 0, limit),
		staleTime: CACHE_TIMES.SEARCH,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}

export function searchPlaylistsQueryOptions(query: string, limit: number) {
	return queryOptions({
		queryKey: CACHE_KEYS.SEARCH_PLAYLISTS(query, limit),
		queryFn: () => searchPlaylists(query, 0, limit),
		staleTime: CACHE_TIMES.SEARCH,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}

export function songSuggestionsQueryOptions(id: string, limit: number) {
	return queryOptions({
		queryKey: CACHE_KEYS.SUGGESTIONS(id, limit),
		queryFn: () => getSongSuggestions(id, limit),
		staleTime: CACHE_TIMES.SONG,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}

export function artistSongsQueryOptions(
	id: string,
	sortBy: "popularity" | "latest" | "alphabetical",
	sortOrder: "asc" | "desc",
) {
	return queryOptions({
		queryKey: CACHE_KEYS.ARTIST_SONGS(id, sortBy, sortOrder),
		queryFn: () => getArtistSongs(id, 0, sortBy, sortOrder),
		staleTime: CACHE_TIMES.ARTIST,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}

export function artistAlbumsQueryOptions(
	id: string,
	sortBy: "popularity" | "latest" | "alphabetical",
	sortOrder: "asc" | "desc",
) {
	return queryOptions({
		queryKey: CACHE_KEYS.ARTIST_ALBUMS(id, sortBy, sortOrder),
		queryFn: () => getArtistAlbums(id, 0, sortBy, sortOrder),
		staleTime: CACHE_TIMES.ARTIST,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}
