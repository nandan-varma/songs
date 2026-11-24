import { notFound } from "next/navigation";
import type { Card, ImageLink, TopResult, Track } from "@/lib/models";
import { ApiError, api, unwrap } from "./client";
import {
	albumCard,
	artistCard,
	playlistCard,
	toTrack,
	toTracks,
	uniqueById,
} from "./mappers";

const SEARCH_PAGE_SIZE = 20;
const PLAYLIST_PAGE_SIZE = 50;
const PLAYLIST_MAX_PAGES = 10;

export interface Collection {
	title: string;
	subtitle?: string;
	meta?: string;
	image: ImageLink[];
	tracks: Track[];
}

export const orNotFound = <T>(request: Promise<T>): Promise<T> =>
	request.catch((error: unknown) => {
		if (
			error instanceof ApiError &&
			(error.status === 404 || error.status === 400)
		) {
			notFound();
		}
		throw error;
	});

const countLabel = (count: number | null, noun: string) =>
	count ? `${count} ${noun}` : undefined;

const joinMeta = (...parts: (string | null | undefined)[]) =>
	parts.filter(Boolean).join(" · ") || undefined;

export async function getTrending(language: string) {
	const query = { language };
	const [songs, albums, playlists] = await Promise.all([
		unwrap(api.trending.songs.$get({ query })),
		unwrap(api.trending.albums.$get({ query })),
		unwrap(api.trending.playlists.$get({ query })),
	]);
	return {
		songs: toTracks(songs),
		albums: uniqueById(albums.map(albumCard)),
		playlists: uniqueById(playlists.map(playlistCard)),
	};
}

export async function getHome(language: string) {
	const [trending, charts] = await Promise.all([
		getTrending(language),
		unwrap(api.charts.$get()),
	]);
	return { ...trending, charts: uniqueById(charts.map(playlistCard)) };
}

export async function getAlbum(id: string): Promise<Collection> {
	const album = await orNotFound(unwrap(api.albums.$get({ query: { id } })));
	return {
		title: album.name,
		subtitle: album.artists.primary.map((artist) => artist.name).join(", "),
		meta: joinMeta(
			album.year?.toString(),
			countLabel(album.songCount, "songs"),
		),
		image: album.image,
		tracks: toTracks(album.songs),
	};
}

export async function getPlaylist(id: string): Promise<Collection> {
	const query = { id, limit: String(PLAYLIST_PAGE_SIZE) };
	const first = await orNotFound(
		unwrap(api.playlists.$get({ query: { ...query, page: "0" } })),
	);
	const pages = Math.min(
		Math.ceil((first.songCount ?? 0) / PLAYLIST_PAGE_SIZE),
		PLAYLIST_MAX_PAGES,
	);
	const rest = await Promise.all(
		Array.from({ length: Math.max(pages - 1, 0) }, (_, i) =>
			unwrap(api.playlists.$get({ query: { ...query, page: String(i + 1) } })),
		),
	);
	const songs = [first, ...rest].flatMap((page) => page.songs);
	return {
		title: first.name,
		subtitle: first.description ?? undefined,
		meta: countLabel(first.songCount, "songs"),
		image: first.image,
		tracks: toTracks(songs),
	};
}

const compact = new Intl.NumberFormat("en", { notation: "compact" });

export async function getArtist(id: string) {
	const artist = await orNotFound(
		unwrap(
			api.artists[":id"].$get({
				param: { id },
				query: { songCount: "20", albumCount: "12" },
			}),
		),
	);
	return {
		title: artist.name,
		meta: artist.followerCount
			? `${compact.format(artist.followerCount)} followers`
			: undefined,
		image: artist.image,
		songs: toTracks(artist.topSongs),
		albums: uniqueById(artist.topAlbums.map(albumCard)),
		similar: uniqueById(artist.similarArtists.map(artistCard)),
	};
}

export async function getSong(id: string) {
	const [song] = await unwrap(api.songs[":id"].$get({ param: { id } }));
	const track = song && toTrack(song);
	if (!song || !track) throw new ApiError("This song is not available", 404);
	return {
		track,
		lyricsId: song.hasLyrics ? song.lyricsId : null,
		meta: joinMeta(song.album.name, song.year),
	};
}

export async function getSuggestions(id: string): Promise<Track[]> {
	const songs = await unwrap(
		api.songs[":id"].suggestions.$get({
			param: { id },
			query: { limit: "10" },
		}),
	);
	return toTracks(songs);
}

export async function getLyrics(lyricsId: string) {
	const lyrics = await unwrap(
		api.songs[":id"].lyrics.$get({ param: { id: lyricsId } }),
	);
	return { text: lyrics.lyrics, copyright: lyrics.copyright };
}

type SearchKind = "songs" | "albums" | "artists" | "playlists";
export type CardSearchKind = Exclude<SearchKind, "songs">;

export interface Page<T> {
	items: T[];
	hasMore: boolean;
}

const pageOf = <T>(
	items: T[],
	result: { total: number; start: number },
): Page<T> => ({
	items,
	hasMore: result.start + items.length < result.total,
});

const pagedQuery = (query: string, page: number) => ({
	query,
	page: String(page),
	limit: String(SEARCH_PAGE_SIZE),
});

export async function searchSongs(
	query: string,
	page: number,
	signal: AbortSignal,
) {
	const result = await unwrap(
		api.search.songs.$get(
			{ query: pagedQuery(query, page) },
			{ init: { signal } },
		),
	);
	return pageOf(toTracks(result.results), result);
}

export async function searchCards(
	kind: CardSearchKind,
	query: string,
	page: number,
	signal: AbortSignal,
): Promise<Page<Card>> {
	const args = [
		{ query: pagedQuery(query, page) },
		{ init: { signal } },
	] as const;
	switch (kind) {
		case "albums": {
			const result = await unwrap(api.search.albums.$get(...args));
			return pageOf(uniqueById(result.results.map(albumCard)), result);
		}
		case "artists": {
			const result = await unwrap(api.search.artists.$get(...args));
			return pageOf(uniqueById(result.results.map(artistCard)), result);
		}
		case "playlists": {
			const result = await unwrap(api.search.playlists.$get(...args));
			return pageOf(uniqueById(result.results.map(playlistCard)), result);
		}
	}
}

export interface SearchOverview {
	top: TopResult | null;
	songs: Track[];
	albums: Card[];
	artists: Card[];
	playlists: Card[];
}

export async function searchOverview(
	query: string,
	signal: AbortSignal,
): Promise<SearchOverview> {
	const result = await unwrap(
		api.search.$get({ query: { query, limit: "6" } }, { init: { signal } }),
	);
	const { topResult } = result;
	return {
		top: topResult && {
			id: topResult.id,
			kind: topResult.type,
			title: topResult.name,
			subtitle: topResult.subtitle ?? undefined,
			image: topResult.image,
		},
		songs: toTracks(result.songs),
		albums: uniqueById(result.albums.map(albumCard)),
		artists: uniqueById(result.artists.map(artistCard)),
		playlists: uniqueById(result.playlists.map(playlistCard)),
	};
}
