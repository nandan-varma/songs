import { queryOptions } from "@tanstack/react-query";
import {
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

export function searchSongsQueryOptions(query: string, limit: number) {
	return queryOptions({
		queryKey: ["search-songs", query, limit],
		queryFn: () => searchSongs(query, 0, limit),
		staleTime: CACHE_TIMES.SEARCH,
	});
}

export function searchAlbumsQueryOptions(query: string, limit: number) {
	return queryOptions({
		queryKey: ["search-albums", query, limit],
		queryFn: () => searchAlbums(query, 0, limit),
		staleTime: CACHE_TIMES.SEARCH,
	});
}

export function searchArtistsQueryOptions(query: string, limit: number) {
	return queryOptions({
		queryKey: ["search-artists", query, limit],
		queryFn: () => searchArtists(query, 0, limit),
		staleTime: CACHE_TIMES.SEARCH,
	});
}

export function searchPlaylistsQueryOptions(query: string, limit: number) {
	return queryOptions({
		queryKey: ["search-playlists", query, limit],
		queryFn: () => searchPlaylists(query, 0, limit),
		staleTime: CACHE_TIMES.SEARCH,
	});
}

export function songSuggestionsQueryOptions(id: string, limit: number) {
	return queryOptions({
		queryKey: ["suggestions", id, limit],
		queryFn: () => getSongSuggestions(id, limit),
		staleTime: CACHE_TIMES.SONG,
	});
}

export function artistSongsQueryOptions(
	id: string,
	sortBy: "popularity" | "latest" | "alphabetical",
	sortOrder: "asc" | "desc",
) {
	return queryOptions({
		queryKey: ["artist-songs", id, sortBy, sortOrder],
		queryFn: () => getArtistSongs(id, 0, sortBy, sortOrder),
		staleTime: CACHE_TIMES.ARTIST,
	});
}

export function artistAlbumsQueryOptions(
	id: string,
	sortBy: "popularity" | "latest" | "alphabetical",
	sortOrder: "asc" | "desc",
) {
	return queryOptions({
		queryKey: ["artist-albums", id, sortBy, sortOrder],
		queryFn: () => getArtistAlbums(id, 0, sortBy, sortOrder),
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

export function trendingQueryOptions(
	type: "song" | "album" | "playlist",
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
