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

const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL ?? "https://saavn-api.nandanvarma.com/api";

const ENTITY_ID_REGEX = /^[a-zA-Z0-9-]{5,50}$/;

function validateEntityId(id: string): void {
	if (!ENTITY_ID_REGEX.test(id)) {
		throw new Error(`Invalid entity ID format: ${id}`);
	}
}

/**
 * Internal helper to fetch and decode API responses
 * @internal
 */
async function fetchAndDecode<T>(
	url: string,
	errorMessage: string,
	options?: { signal?: AbortSignal },
): Promise<T> {
	const response = await fetch(url, { signal: options?.signal });
	if (!response.ok) {
		throw new Error(errorMessage);
	}
	const data = await response.json();
	return data as T;
}

/**
 * Performs a global search across all content types
 * @param query - The search query string
 * @param options - Optional fetch options (e.g., abort signal)
 * @returns Promise resolving to combined search results
 */
export async function searchMusic(
	query: string,
	options?: { signal?: AbortSignal },
): Promise<SearchResponse> {
	return fetchAndDecode<SearchResponse>(
		`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`,
		"Failed to fetch search results",
		options,
	);
}

/**
 * Searches for songs with pagination
 * @param query - The search query string
 * @param page - Page number (0-indexed, default: 0)
 * @param limit - Number of results per page (default: 10)
 * @returns Promise resolving to paginated song results
 */
export async function searchSongs(
	query: string,
	page = 0,
	limit = 10,
): Promise<ApiResponse<PaginatedResponse<DetailedSong>>> {
	return fetchAndDecode<ApiResponse<PaginatedResponse<DetailedSong>>>(
		`${API_BASE_URL}/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
		"Failed to search songs",
	);
}

/**
 * Searches for albums with pagination
 * @param query - The search query string
 * @param page - Page number (0-indexed, default: 0)
 * @param limit - Number of results per page (default: 10)
 * @returns Promise resolving to paginated album results
 */
export async function searchAlbums(
	query: string,
	page = 0,
	limit = 10,
): Promise<ApiResponse<PaginatedResponse<AlbumSearchResult>>> {
	return fetchAndDecode<ApiResponse<PaginatedResponse<AlbumSearchResult>>>(
		`${API_BASE_URL}/search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
		"Failed to search albums",
	);
}

/**
 * Searches for artists with pagination
 * @param query - The search query string
 * @param page - Page number (0-indexed, default: 0)
 * @param limit - Number of results per page (default: 10)
 * @returns Promise resolving to paginated artist results
 */
export async function searchArtists(
	query: string,
	page = 0,
	limit = 10,
): Promise<ApiResponse<PaginatedResponse<ArtistSearchResult>>> {
	return fetchAndDecode<ApiResponse<PaginatedResponse<ArtistSearchResult>>>(
		`${API_BASE_URL}/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
		"Failed to search artists",
	);
}

/**
 * Searches for playlists with pagination
 * @param query - The search query string
 * @param page - Page number (0-indexed, default: 0)
 * @param limit - Number of results per page (default: 10)
 * @returns Promise resolving to paginated playlist results
 */
export async function searchPlaylists(
	query: string,
	page = 0,
	limit = 10,
): Promise<ApiResponse<PaginatedResponse<PlaylistSearchResult>>> {
	return fetchAndDecode<ApiResponse<PaginatedResponse<PlaylistSearchResult>>>(
		`${API_BASE_URL}/search/playlists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
		"Failed to search playlists",
	);
}

/**
 * Fetches a single song by its ID
 * @param id - The unique song identifier
 * @returns Promise resolving to song details
 */
export async function getSongById(
	id: string,
): Promise<ApiResponse<DetailedSong[]>> {
	validateEntityId(id);
	return fetchAndDecode<ApiResponse<DetailedSong[]>>(
		`${API_BASE_URL}/songs/${encodeURIComponent(id)}`,
		"Failed to fetch song",
	);
}

/**
 * Fetches multiple songs by their IDs
 * @param ids - Array of song identifiers
 * @returns Promise resolving to array of song details
 */
export async function getSongsByIds(
	ids: string[],
): Promise<ApiResponse<DetailedSong[]>> {
	return fetchAndDecode<ApiResponse<DetailedSong[]>>(
		`${API_BASE_URL}/songs?ids=${ids.join(",")}`,
		"Failed to fetch songs",
	);
}

/**
 * Fetches suggested songs based on a given song ID
 * @param id - The source song identifier
 * @param limit - Maximum number of suggestions (default: 10)
 * @returns Promise resolving to suggested songs
 */
export async function getSongSuggestions(
	id: string,
	limit = 10,
): Promise<ApiResponse<DetailedSong[]>> {
	validateEntityId(id);
	return fetchAndDecode<ApiResponse<DetailedSong[]>>(
		`${API_BASE_URL}/songs/${encodeURIComponent(id)}/suggestions?limit=${limit}`,
		"Failed to fetch song suggestions",
	);
}

/**
 * Fetches a single album by its ID
 * @param id - The unique album identifier
 * @returns Promise resolving to album details with tracks
 */
export async function getAlbumById(
	id: string,
): Promise<ApiResponse<DetailedAlbum>> {
	validateEntityId(id);
	return fetchAndDecode<ApiResponse<DetailedAlbum>>(
		`${API_BASE_URL}/albums?id=${encodeURIComponent(id)}`,
		"Failed to fetch album",
	);
}

/**
 * Fetches a single artist by their ID with optional parameters
 * @param id - The unique artist identifier
 * @param options - Optional parameters for page, counts, and sorting
 * @returns Promise resolving to artist details
 */
export async function getArtistById(
	id: string,
	options?: {
		page?: number;
		songCount?: number;
		albumCount?: number;
		sortBy?: "popularity" | "latest" | "alphabetical";
		sortOrder?: "asc" | "desc";
	},
): Promise<ApiResponse<DetailedArtist>> {
	validateEntityId(id);
	const params = new URLSearchParams({ id: encodeURIComponent(id) });

	if (options?.page !== undefined)
		params.append("page", options.page.toString());
	if (options?.songCount)
		params.append("songCount", options.songCount.toString());
	if (options?.albumCount)
		params.append("albumCount", options.albumCount.toString());
	if (options?.sortBy) params.append("sortBy", options.sortBy);
	if (options?.sortOrder) params.append("sortOrder", options.sortOrder);

	return fetchAndDecode<ApiResponse<DetailedArtist>>(
		`${API_BASE_URL}/artists?${params.toString()}`,
		"Failed to fetch artist",
	);
}

/**
 * Fetches songs by a specific artist with pagination and sorting
 * @param id - The artist identifier
 * @param page - Page number (0-indexed, default: 0)
 * @param sortBy - Sort field (default: popularity)
 * @param sortOrder - Sort direction (default: desc)
 * @returns Promise resolving to paginated artist songs
 */
export async function getArtistSongs(
	id: string,
	page = 0,
	sortBy: "popularity" | "latest" | "alphabetical" = "popularity",
	sortOrder: "asc" | "desc" = "desc",
): Promise<ApiResponse<{ total: number; songs: DetailedSong[] }>> {
	validateEntityId(id);
	return fetchAndDecode<ApiResponse<{ total: number; songs: DetailedSong[] }>>(
		`${API_BASE_URL}/artists/${encodeURIComponent(id)}/songs?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
		"Failed to fetch artist songs",
	);
}

/**
 * Fetches albums by a specific artist with pagination and sorting
 * @param id - The artist identifier
 * @param page - Page number (0-indexed, default: 0)
 * @param sortBy - Sort field (default: popularity)
 * @param sortOrder - Sort direction (default: desc)
 * @returns Promise resolving to paginated artist albums
 */
export async function getArtistAlbums(
	id: string,
	page = 0,
	sortBy: "popularity" | "latest" | "alphabetical" = "popularity",
	sortOrder: "asc" | "desc" = "desc",
): Promise<ApiResponse<{ total: number; albums: DetailedAlbum[] }>> {
	validateEntityId(id);
	return fetchAndDecode<
		ApiResponse<{ total: number; albums: DetailedAlbum[] }>
	>(
		`${API_BASE_URL}/artists/${encodeURIComponent(id)}/albums?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
		"Failed to fetch artist albums",
	);
}

/**
 * Fetches a single playlist by its ID
 * @param id - The unique playlist identifier
 * @param page - Page number for tracks (0-indexed, default: 0)
 * @param limit - Number of tracks per page (default: 10)
 * @returns Promise resolving to playlist details with tracks
 */
export async function getPlaylistById(
	id: string,
	page = 0,
	limit = 10,
): Promise<ApiResponse<DetailedPlaylist>> {
	validateEntityId(id);
	return fetchAndDecode<ApiResponse<DetailedPlaylist>>(
		`${API_BASE_URL}/playlists?id=${encodeURIComponent(id)}&page=${page}&limit=${limit}`,
		"Failed to fetch playlist",
	);
}
