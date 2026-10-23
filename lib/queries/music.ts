import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import {
	FIRST_SEARCH_PAGE,
	getAlbumById,
	getArtistAlbums,
	getArtistById,
	getArtistRadio,
	getArtistSongs,
	getCharts,
	getPlaylistById,
	getRadioFeatured,
	getRadioStations,
	getSongById,
	getSongLyrics,
	getSongSuggestions,
	getSongsByIds,
	getTrending,
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
	});
}

export function songsQueryOptions(ids: string[]) {
	return queryOptions({
		queryKey: ["songs", ...ids],
		queryFn: () => getSongsByIds(ids),
		staleTime: CACHE_TIMES.SONG,
	});
}

export function albumQueryOptions(id: string) {
	return queryOptions({
		queryKey: CACHE_KEYS.ALBUM(id),
		queryFn: () => getAlbumById(id),
		staleTime: CACHE_TIMES.ALBUM,
	});
}

export function artistQueryOptions(id: string) {
	return queryOptions({
		queryKey: CACHE_KEYS.ARTIST(id),
		queryFn: () => getArtistById(id),
		staleTime: CACHE_TIMES.ARTIST,
	});
}

export function playlistQueryOptions(id: string) {
	return queryOptions({
		queryKey: CACHE_KEYS.PLAYLIST(id),
		queryFn: () => getPlaylistById(id),
		staleTime: CACHE_TIMES.ALBUM,
	});
}

export function globalSearchQueryOptions(query: string) {
	return queryOptions({
		queryKey: CACHE_KEYS.SEARCH(query),
		queryFn: () => searchMusic(query),
		staleTime: CACHE_TIMES.SEARCH,
	});
}

function nextPageParam(
	loaded: number,
	total: number,
	lastPageSize: number,
	lastPageParam: number,
): number | undefined {
	return lastPageSize > 0 && loaded < total ? lastPageParam + 1 : undefined;
}

function searchInfiniteOptions<T>(
	kind: string,
	query: string,
	limit: number,
	fetchPage: (
		query: string,
		page: number,
		limit: number,
	) => Promise<{ total: number; results: T[] }>,
) {
	return infiniteQueryOptions({
		queryKey: ["search", kind, query, limit],
		queryFn: ({ pageParam }) => fetchPage(query, pageParam, limit),
		initialPageParam: FIRST_SEARCH_PAGE,
		getNextPageParam: (lastPage, pages, lastPageParam) =>
			nextPageParam(
				pages.reduce((count, page) => count + page.results.length, 0),
				lastPage.total,
				lastPage.results.length,
				lastPageParam,
			),
		staleTime: CACHE_TIMES.SEARCH,
	});
}

export function searchSongsQueryOptions(query: string, limit: number) {
	return searchInfiniteOptions("songs", query, limit, searchSongs);
}

export function searchAlbumsQueryOptions(query: string, limit: number) {
	return searchInfiniteOptions("albums", query, limit, searchAlbums);
}

export function searchArtistsQueryOptions(query: string, limit: number) {
	return searchInfiniteOptions("artists", query, limit, searchArtists);
}

export function searchPlaylistsQueryOptions(query: string, limit: number) {
	return searchInfiniteOptions("playlists", query, limit, searchPlaylists);
}

export function songSuggestionsQueryOptions(id: string, limit: number) {
	return queryOptions({
		queryKey: ["suggestions", id, limit],
		queryFn: () => getSongSuggestions(id, limit),
		staleTime: CACHE_TIMES.SONG,
	});
}

export type ArtistSortBy = "popularity" | "latest" | "alphabetical";
export type ArtistSortOrder = "asc" | "desc";

export function artistSongsQueryOptions(
	id: string,
	sortBy: ArtistSortBy,
	sortOrder: ArtistSortOrder,
) {
	return infiniteQueryOptions({
		queryKey: ["artist-songs", id, sortBy, sortOrder],
		queryFn: ({ pageParam }) =>
			getArtistSongs(id, pageParam, sortBy, sortOrder),
		initialPageParam: 0,
		getNextPageParam: (lastPage, pages, lastPageParam) =>
			nextPageParam(
				pages.reduce((count, page) => count + page.songs.length, 0),
				lastPage.total,
				lastPage.songs.length,
				lastPageParam,
			),
		staleTime: CACHE_TIMES.ARTIST,
	});
}

export function artistAlbumsQueryOptions(
	id: string,
	sortBy: ArtistSortBy,
	sortOrder: ArtistSortOrder,
) {
	return infiniteQueryOptions({
		queryKey: ["artist-albums", id, sortBy, sortOrder],
		queryFn: ({ pageParam }) =>
			getArtistAlbums(id, pageParam, sortBy, sortOrder),
		initialPageParam: 0,
		getNextPageParam: (lastPage, pages, lastPageParam) =>
			nextPageParam(
				pages.reduce((count, page) => count + page.albums.length, 0),
				lastPage.total,
				lastPage.albums.length,
				lastPageParam,
			),
		staleTime: CACHE_TIMES.ARTIST,
	});
}

export function songLyricsQueryOptions(id: string) {
	return queryOptions({
		queryKey: CACHE_KEYS.LYRICS(id),
		queryFn: () => getSongLyrics(id),
		staleTime: CACHE_TIMES.LYRICS,
	});
}

export function artistRadioQueryOptions(id: string, limit: number) {
	return queryOptions({
		queryKey: CACHE_KEYS.ARTIST_RADIO(id),
		queryFn: () => getArtistRadio(id, limit),
		staleTime: CACHE_TIMES.ARTIST,
	});
}

export function trendingQueryOptions<K extends "song" | "album" | "playlist">(
	type: K,
	language: string,
) {
	return queryOptions({
		queryKey: CACHE_KEYS.TRENDING(type, language),
		queryFn: () => getTrending(type, language),
		staleTime: CACHE_TIMES.TRENDING,
	});
}

export function chartsQueryOptions() {
	return queryOptions({
		queryKey: CACHE_KEYS.CHARTS,
		queryFn: () => getCharts(),
		staleTime: CACHE_TIMES.CHARTS,
	});
}

export function radioStationsQueryOptions() {
	return queryOptions({
		queryKey: CACHE_KEYS.RADIO_STATIONS,
		queryFn: () => getRadioStations(),
		staleTime: CACHE_TIMES.RADIO_STATIONS,
	});
}

export function radioFeaturedQueryOptions(
	name: string,
	language: string,
	limit: number,
) {
	return queryOptions({
		queryKey: CACHE_KEYS.RADIO_FEATURED(name),
		queryFn: () => getRadioFeatured(name, language, limit),
		staleTime: CACHE_TIMES.RADIO_STATIONS,
	});
}
