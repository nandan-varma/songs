import type { Card, Track } from "@/lib/models";
import { api, unwrap } from "./client";
import {
	albumCard,
	artistCard,
	isAlbum,
	isPlaylist,
	isSong,
	playlistCard,
	toTrack,
	toTracks,
} from "./mappers";

/** Page size for search results. */
const SEARCH_PAGE_SIZE = 20;
/** Upstream caps a playlist page at 50 songs. */
const PLAYLIST_PAGE_SIZE = 50;
const PLAYLIST_MAX_PAGES = 10;

/** What a collection page (album, playlist, artist, song) needs to render. */
export interface Collection {
	title: string;
	subtitle?: string;
	meta?: string;
	image: string;
	tracks: Track[];
}

const countLabel = (count: number | null, noun: string) =>
	count ? `${count} ${noun}` : undefined;

const joinMeta = (...parts: (string | null | undefined)[]) =>
	parts.filter(Boolean).join(" · ") || undefined;

export async function getHome(language: string) {
	const [songs, albums, playlists, charts] = await Promise.all([
		unwrap(api.trending.$get({ query: { type: "song", language } })),
		unwrap(api.trending.$get({ query: { type: "album", language } })),
		unwrap(api.trending.$get({ query: { type: "playlist", language } })),
		unwrap(api.charts.$get()),
	]);
	return {
		songs: toTracks(songs.filter(isSong)),
		albums: albums.filter(isAlbum).map(albumCard),
		playlists: playlists.filter(isPlaylist).map(playlistCard),
		charts: charts.map(playlistCard),
	};
}

export async function getAlbum(id: string): Promise<Collection> {
	const album = await unwrap(api.albums.$get({ query: { id } }));
	return {
		title: album.name,
		subtitle: album.artists.primary.map((artist) => artist.name).join(", "),
		meta: joinMeta(
			album.year?.toString(),
			countLabel(album.songCount, "songs"),
		),
		image: album.image.at(-1)?.url ?? "",
		tracks: toTracks(album.songs),
	};
}

export async function getPlaylist(id: string): Promise<Collection> {
	const query = { id, limit: String(PLAYLIST_PAGE_SIZE) };
	const first = await unwrap(
		api.playlists.$get({ query: { ...query, page: "0" } }),
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
		image: first.image.at(-1)?.url ?? "",
		tracks: toTracks(songs),
	};
}

const compact = new Intl.NumberFormat("en", { notation: "compact" });

export async function getArtist(id: string) {
	const artist = await unwrap(
		api.artists[":id"].$get({
			param: { id },
			query: { songCount: "20", albumCount: "12" },
		}),
	);
	return {
		title: artist.name,
		meta: artist.followerCount
			? `${compact.format(artist.followerCount)} followers`
			: undefined,
		image: artist.image.at(-1)?.url ?? "",
		songs: toTracks(artist.topSongs),
		albums: artist.topAlbums.map(albumCard),
		similar: artist.similarArtists.map(artistCard),
	};
}

export async function getSong(id: string) {
	const [song] = await unwrap(api.songs[":id"].$get({ param: { id } }));
	const track = song && toTrack(song);
	if (!song || !track) throw new Error("This song is not available");
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

export type SearchKind = "songs" | "albums" | "artists" | "playlists";
export type CardSearchKind = Exclude<SearchKind, "songs">;

export interface Page<T> {
	items: T[];
	hasMore: boolean;
}

const searchParams = (query: string, page: number) => ({
	query,
	page: String(page),
	limit: String(SEARCH_PAGE_SIZE),
});

const pageOf = <T>(
	items: T[],
	result: { total: number; start: number },
): Page<T> => ({
	items,
	hasMore: result.start + items.length < result.total,
});

export async function searchSongs(query: string, page: number) {
	const result = await unwrap(
		api.search.songs.$get({ query: searchParams(query, page) }),
	);
	return pageOf(toTracks(result.results), result);
}

export async function searchCards(
	kind: CardSearchKind,
	query: string,
	page: number,
): Promise<Page<Card>> {
	const params = { query: searchParams(query, page) };
	switch (kind) {
		case "albums": {
			const result = await unwrap(api.search.albums.$get(params));
			return pageOf(result.results.map(albumCard), result);
		}
		case "artists": {
			const result = await unwrap(api.search.artists.$get(params));
			return pageOf(result.results.map(artistCard), result);
		}
		case "playlists": {
			const result = await unwrap(api.search.playlists.$get(params));
			return pageOf(result.results.map(playlistCard), result);
		}
	}
}
