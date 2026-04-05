import he from "he";
import { publicConfig } from "@/lib/config/public";
import type {
	AlbumSearchResult,
	ApiResponse,
	ArtistSearchResult,
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
	DetailedSong,
	PaginatedResponse,
	PlaylistSearchResult,
	SearchResponse,
} from "@/types/api";

const API_BASE_URL = publicConfig.NEXT_PUBLIC_API_URL;

const ENTITY_ID_REGEX = /^[a-zA-Z0-9-]{5,50}$/;

function validateEntityId(id: string): void {
	if (!ENTITY_ID_REGEX.test(id)) {
		throw new Error(`Invalid entity ID format: ${id}`);
	}
}

async function fetchApi<T>(
	url: string,
	errorMessage: string,
	options?: { signal?: AbortSignal },
): Promise<T> {
	const response = await fetch(url, { signal: options?.signal });
	if (!response.ok) {
		throw new Error(errorMessage);
	}

	const text = await response.text();
	const data = JSON.parse(text, (_key, value) => {
		if (typeof value === "string" && value.includes("&")) {
			return he.decode(value);
		}
		return value;
	}) as ApiResponse<T>;
	return data.data;
}

export async function searchMusic(
	query: string,
	options?: { signal?: AbortSignal },
): Promise<SearchResponse> {
	return fetchApi<SearchResponse>(
		`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`,
		"Failed to fetch search results",
		options,
	);
}

export async function searchSongs(
	query: string,
	page = 0,
	limit = 10,
): Promise<PaginatedResponse<DetailedSong>> {
	return fetchApi<PaginatedResponse<DetailedSong>>(
		`${API_BASE_URL}/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
		"Failed to search songs",
	);
}

export async function searchAlbums(
	query: string,
	page = 0,
	limit = 10,
): Promise<PaginatedResponse<AlbumSearchResult>> {
	return fetchApi<PaginatedResponse<AlbumSearchResult>>(
		`${API_BASE_URL}/search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
		"Failed to search albums",
	);
}

export async function searchArtists(
	query: string,
	page = 0,
	limit = 10,
): Promise<PaginatedResponse<ArtistSearchResult>> {
	return fetchApi<PaginatedResponse<ArtistSearchResult>>(
		`${API_BASE_URL}/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
		"Failed to search artists",
	);
}

export async function searchPlaylists(
	query: string,
	page = 0,
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

export async function getPlaylistById(
	id: string,
	page = 0,
	limit = 10,
): Promise<DetailedPlaylist> {
	validateEntityId(id);
	return fetchApi<DetailedPlaylist>(
		`${API_BASE_URL}/playlists?id=${encodeURIComponent(id)}&page=${page}&limit=${limit}`,
		"Failed to fetch playlist",
	);
}
