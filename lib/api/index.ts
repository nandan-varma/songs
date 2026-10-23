import he from "he";
import { publicConfig } from "@/lib/config/public";
import type {
	AlbumSearchResult,
	ApiResponse,
	ArtistSearchResult,
	Chart,
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
	DetailedSong,
	Lyrics,
	PaginatedResponse,
	PlaylistSearchResult,
} from "@/types/api";

const API_BASE_URL = publicConfig.NEXT_PUBLIC_API_URL;

/** The API paginates every list from page 0. */
export const FIRST_SEARCH_PAGE = 0;

const ENTITY_ID_REGEX = /^[a-zA-Z0-9-]{5,50}$/;

function validateEntityId(id: string): void {
	if (!ENTITY_ID_REGEX.test(id)) {
		throw new Error(`Invalid entity ID format: ${id}`);
	}
}

export class ApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
		this.name = "ApiError";
	}
}

/** The API reports failures as `{ success: false, message }`. */
function readApiMessage(body: string): string | null {
	try {
		const parsed: unknown = JSON.parse(body);
		if (
			typeof parsed === "object" &&
			parsed !== null &&
			"message" in parsed &&
			typeof parsed.message === "string"
		) {
			return parsed.message;
		}
	} catch {
		// Non-JSON error bodies fall back to the caller's message.
	}
	return null;
}

async function fetchApi<T>(
	url: string,
	errorMessage: string,
	options?: { signal?: AbortSignal },
): Promise<T> {
	const response = await fetch(url, { signal: options?.signal });
	const text = await response.text();
	if (!response.ok) {
		throw new ApiError(readApiMessage(text) ?? errorMessage, response.status);
	}

	const data = JSON.parse(text, (_key, value) => {
		if (typeof value === "string" && value.includes("&")) {
			return he.decode(value);
		}
		return value;
	}) as ApiResponse<T>;
	return data.data;
}

export async function searchSongs(
	query: string,
	page = FIRST_SEARCH_PAGE,
	limit = 10,
): Promise<PaginatedResponse<DetailedSong>> {
	return fetchApi<PaginatedResponse<DetailedSong>>(
		`${API_BASE_URL}/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
		"Failed to search songs",
	);
}

export async function searchAlbums(
	query: string,
	page = FIRST_SEARCH_PAGE,
	limit = 10,
): Promise<PaginatedResponse<AlbumSearchResult>> {
	return fetchApi<PaginatedResponse<AlbumSearchResult>>(
		`${API_BASE_URL}/search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
		"Failed to search albums",
	);
}

export async function searchArtists(
	query: string,
	page = FIRST_SEARCH_PAGE,
	limit = 10,
): Promise<PaginatedResponse<ArtistSearchResult>> {
	return fetchApi<PaginatedResponse<ArtistSearchResult>>(
		`${API_BASE_URL}/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
		"Failed to search artists",
	);
}

export async function searchPlaylists(
	query: string,
	page = FIRST_SEARCH_PAGE,
	limit = 10,
): Promise<PaginatedResponse<PlaylistSearchResult>> {
	return fetchApi<PaginatedResponse<PlaylistSearchResult>>(
		`${API_BASE_URL}/search/playlists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
		"Failed to search playlists",
	);
}

export async function getSongById(id: string): Promise<DetailedSong[]> {
	validateEntityId(id);
	return fetchApi<DetailedSong[]>(
		`${API_BASE_URL}/songs/${encodeURIComponent(id)}`,
		"Failed to fetch song",
	);
}

export async function getSongsByIds(ids: string[]): Promise<DetailedSong[]> {
	return fetchApi<DetailedSong[]>(
		`${API_BASE_URL}/songs?ids=${ids.join(",")}`,
		"Failed to fetch songs",
	);
}

export async function getSongSuggestions(
	id: string,
	limit = 10,
): Promise<DetailedSong[]> {
	validateEntityId(id);
	return fetchApi<DetailedSong[]>(
		`${API_BASE_URL}/songs/${encodeURIComponent(id)}/suggestions?limit=${limit}`,
		"Failed to fetch song suggestions",
	);
}

export async function getAlbumById(id: string): Promise<DetailedAlbum> {
	validateEntityId(id);
	return fetchApi<DetailedAlbum>(
		`${API_BASE_URL}/albums?id=${encodeURIComponent(id)}`,
		"Failed to fetch album",
	);
}

export async function getArtistById(
	id: string,
	options?: {
		page?: number;
		songCount?: number;
		albumCount?: number;
		sortBy?: "popularity" | "latest" | "alphabetical";
		sortOrder?: "asc" | "desc";
	},
): Promise<DetailedArtist> {
	validateEntityId(id);
	const params = new URLSearchParams({ id });

	if (options?.page !== undefined)
		params.append("page", options.page.toString());
	if (options?.songCount)
		params.append("songCount", options.songCount.toString());
	if (options?.albumCount)
		params.append("albumCount", options.albumCount.toString());
	if (options?.sortBy) params.append("sortBy", options.sortBy);
	if (options?.sortOrder) params.append("sortOrder", options.sortOrder);

	return fetchApi<DetailedArtist>(
		`${API_BASE_URL}/artists?${params.toString()}`,
		"Failed to fetch artist",
	);
}

export async function getArtistSongs(
	id: string,
	page = 0,
	sortBy: "popularity" | "latest" | "alphabetical" = "popularity",
	sortOrder: "asc" | "desc" = "desc",
): Promise<{ total: number; songs: DetailedSong[] }> {
	validateEntityId(id);
	return fetchApi<{ total: number; songs: DetailedSong[] }>(
		`${API_BASE_URL}/artists/${encodeURIComponent(id)}/songs?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
		"Failed to fetch artist songs",
	);
}

export async function getArtistAlbums(
	id: string,
	page = 0,
	sortBy: "popularity" | "latest" | "alphabetical" = "popularity",
	sortOrder: "asc" | "desc" = "desc",
): Promise<{ total: number; albums: DetailedAlbum[] }> {
	validateEntityId(id);
	return fetchApi<{ total: number; albums: DetailedAlbum[] }>(
		`${API_BASE_URL}/artists/${encodeURIComponent(id)}/albums?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
		"Failed to fetch artist albums",
	);
}

/** Upstream caps a playlist page at 50 songs, so larger playlists need several requests. */
const PLAYLIST_PAGE_SIZE = 50;
const PLAYLIST_MAX_PAGES = 20;

async function getPlaylistPage(
	id: string,
	page: number,
	limit: number,
): Promise<DetailedPlaylist> {
	return fetchApi<DetailedPlaylist>(
		`${API_BASE_URL}/playlists?id=${encodeURIComponent(id)}&page=${page}&limit=${limit}`,
		"Failed to fetch playlist",
	);
}

/** Fetches a playlist with every song, not just the API's default first 10. */
export async function getPlaylistById(id: string): Promise<DetailedPlaylist> {
	validateEntityId(id);
	const first = await getPlaylistPage(id, 0, PLAYLIST_PAGE_SIZE);
	const songs = [...first.songs];
	const total = first.songCount ?? songs.length;

	for (
		let page = 1;
		songs.length < total && page < PLAYLIST_MAX_PAGES;
		page++
	) {
		const next = await getPlaylistPage(id, page, PLAYLIST_PAGE_SIZE);
		if (next.songs.length === 0) break;
		songs.push(...next.songs);
	}

	return { ...first, songs: dedupeById(songs) };
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
	const seen = new Set<string>();
	return items.filter((item) => {
		if (seen.has(item.id)) return false;
		seen.add(item.id);
		return true;
	});
}

export async function getSongLyrics(id: string): Promise<Lyrics> {
	validateEntityId(id);
	return fetchApi<Lyrics>(
		`${API_BASE_URL}/songs/${encodeURIComponent(id)}/lyrics`,
		"Failed to fetch lyrics",
	);
}

interface TrendingTypeMap {
	song: DetailedSong;
	album: DetailedAlbum;
	playlist: DetailedPlaylist;
}

export async function getTrending<K extends keyof TrendingTypeMap>(
	type: K,
	language: string,
): Promise<TrendingTypeMap[K][]> {
	return fetchApi<TrendingTypeMap[K][]>(
		`${API_BASE_URL}/trending?type=${type}&language=${encodeURIComponent(language)}`,
		"Failed to fetch trending content",
	);
}

export async function getCharts(): Promise<Chart[]> {
	return fetchApi<Chart[]>(`${API_BASE_URL}/charts`, "Failed to fetch charts");
}

const JIOSAAVN_LINK_REGEX =
	/^https?:\/\/(?:www\.)?jiosaavn\.com\/(song|album|artist|featured|s\/playlist)\//i;

export type ResolvedLink =
	| { type: "song"; id: string }
	| { type: "album"; id: string }
	| { type: "artist"; id: string }
	| { type: "playlist"; id: string };

export function isJioSaavnLink(value: string): boolean {
	return JIOSAAVN_LINK_REGEX.test(value.trim());
}

/** Resolves a pasted jiosaavn.com URL to the entity it points at. */
export async function resolveJioSaavnLink(
	rawLink: string,
): Promise<ResolvedLink> {
	const link = rawLink.trim();
	const kind = JIOSAAVN_LINK_REGEX.exec(link)?.[1]?.toLowerCase();
	if (!kind) throw new Error("Not a JioSaavn link");
	const encoded = encodeURIComponent(link);

	switch (kind) {
		case "song": {
			const [song] = await fetchApi<DetailedSong[]>(
				`${API_BASE_URL}/songs?link=${encoded}`,
				"Failed to resolve song link",
			);
			if (!song) throw new Error("Song not found");
			return { type: "song", id: song.id };
		}
		case "album": {
			const album = await fetchApi<DetailedAlbum>(
				`${API_BASE_URL}/albums?link=${encoded}`,
				"Failed to resolve album link",
			);
			return { type: "album", id: album.id };
		}
		case "artist": {
			const artist = await fetchApi<DetailedArtist>(
				`${API_BASE_URL}/artists?link=${encoded}&songCount=1&albumCount=1`,
				"Failed to resolve artist link",
			);
			return { type: "artist", id: artist.id };
		}
		default: {
			const playlist = await fetchApi<DetailedPlaylist>(
				`${API_BASE_URL}/playlists?link=${encoded}&limit=1`,
				"Failed to resolve playlist link",
			);
			return { type: "playlist", id: playlist.id };
		}
	}
}
