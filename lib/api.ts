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
} from "./types";

const API_BASE_URL = "https://saavn-api.nandanvarma.com/api";

/**
 * Search for music across all categories (songs, albums, artists, playlists)
 * @param query - The search query string
 * @returns Promise resolving to search results
 */
export async function searchMusic(query: string): Promise<SearchResponse> {
	const response = await fetch(
		`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`,
	);

	if (!response.ok) {
		throw new Error("Failed to fetch search results");
	}

	return response.json();
}

/**
 * Search for songs with pagination
 * @param query - The search query string
 * @param page - Page number (0-based)
 * @param limit - Number of results per page
 * @returns Promise resolving to paginated song results
 */
export async function searchSongs(
	query: string,
	page = 0,
	limit = 10,
): Promise<ApiResponse<PaginatedResponse<DetailedSong>>> {
	const response = await fetch(
		`${API_BASE_URL}/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
	);

	if (!response.ok) {
		throw new Error("Failed to search songs");
	}

	return response.json();
}

export async function searchAlbums(
	query: string,
	page = 0,
	limit = 10,
): Promise<ApiResponse<PaginatedResponse<AlbumSearchResult>>> {
	const response = await fetch(
		`${API_BASE_URL}/search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
	);

	if (!response.ok) {
		throw new Error("Failed to search albums");
	}

	return response.json();
}

export async function searchArtists(
	query: string,
	page = 0,
	limit = 10,
): Promise<ApiResponse<PaginatedResponse<ArtistSearchResult>>> {
	const response = await fetch(
		`${API_BASE_URL}/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
	);

	if (!response.ok) {
		throw new Error("Failed to search artists");
	}

	return response.json();
}

export async function searchPlaylists(
	query: string,
	page = 0,
	limit = 10,
): Promise<ApiResponse<PaginatedResponse<PlaylistSearchResult>>> {
	const response = await fetch(
		`${API_BASE_URL}/search/playlists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
	);

	if (!response.ok) {
		throw new Error("Failed to search playlists");
	}

	return response.json();
}

/**
 * Get detailed information for a single song by ID
 * @param id - The song ID
 * @returns Promise resolving to song details
 */
export async function getSongById(
	id: string,
): Promise<ApiResponse<DetailedSong[]>> {
	const response = await fetch(`${API_BASE_URL}/songs/${id}`);

	if (!response.ok) {
		throw new Error("Failed to fetch song");
	}

	return response.json();
}

/**
 * Get detailed information for songs by their IDs
 * @param ids - Array of song IDs
 * @returns Promise resolving to song details
 */
export async function getSongsByIds(
	ids: string[],
): Promise<ApiResponse<DetailedSong[]>> {
	const response = await fetch(`${API_BASE_URL}/songs?ids=${ids.join(",")}`);

	if (!response.ok) {
		throw new Error("Failed to fetch songs");
	}

	return response.json();
}

export async function getSongSuggestions(
	id: string,
	limit = 10,
): Promise<ApiResponse<DetailedSong[]>> {
	const response = await fetch(
		`${API_BASE_URL}/songs/${id}/suggestions?limit=${limit}`,
	);

	if (!response.ok) {
		throw new Error("Failed to fetch song suggestions");
	}

	return response.json();
}

/**
 * Get detailed information for an album by ID
 * @param id - The album ID
 * @returns Promise resolving to album details
 */
export async function getAlbumById(
	id: string,
): Promise<ApiResponse<DetailedAlbum>> {
	const response = await fetch(`${API_BASE_URL}/albums?id=${id}`);

	if (!response.ok) {
		throw new Error("Failed to fetch album");
	}

	return response.json();
}

/**
 * Get detailed information for an artist by ID
 * @param id - The artist ID
 * @param options - Optional pagination and sorting options
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
	const params = new URLSearchParams({ id });

	if (options?.page !== undefined)
		params.append("page", options.page.toString());
	if (options?.songCount)
		params.append("songCount", options.songCount.toString());
	if (options?.albumCount)
		params.append("albumCount", options.albumCount.toString());
	if (options?.sortBy) params.append("sortBy", options.sortBy);
	if (options?.sortOrder) params.append("sortOrder", options.sortOrder);

	const response = await fetch(`${API_BASE_URL}/artists?${params.toString()}`);

	if (!response.ok) {
		throw new Error("Failed to fetch artist");
	}

	return response.json();
}

export async function getArtistSongs(
	id: string,
	page = 0,
	sortBy: "popularity" | "latest" | "alphabetical" = "popularity",
	sortOrder: "asc" | "desc" = "desc",
): Promise<ApiResponse<{ total: number; songs: DetailedSong[] }>> {
	const response = await fetch(
		`${API_BASE_URL}/artists/${id}/songs?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
	);

	if (!response.ok) {
		throw new Error("Failed to fetch artist songs");
	}

	return response.json();
}

export async function getArtistAlbums(
	id: string,
	page = 0,
	sortBy: "popularity" | "latest" | "alphabetical" = "popularity",
	sortOrder: "asc" | "desc" = "desc",
): Promise<ApiResponse<{ total: number; albums: DetailedAlbum[] }>> {
	const response = await fetch(
		`${API_BASE_URL}/artists/${id}/albums?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
	);

	if (!response.ok) {
		throw new Error("Failed to fetch artist albums");
	}

	return response.json();
}

/**
 * Get detailed information for a playlist by ID
 * @param id - The playlist ID
 * @param page - Page number for pagination
 * @param limit - Number of songs per page
 * @returns Promise resolving to playlist details
 */
export async function getPlaylistById(
	id: string,
	page = 0,
	limit = 10,
): Promise<ApiResponse<DetailedPlaylist>> {
	const response = await fetch(
		`${API_BASE_URL}/playlists?id=${id}&page=${page}&limit=${limit}`,
	);

	if (!response.ok) {
		throw new Error("Failed to fetch playlist");
	}

	return response.json();
}
