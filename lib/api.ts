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

async function fetchAndDecode<T>(
	url: string,
	errorMessage: string,
): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(errorMessage);
	}
	const data = await response.json();
	return data as T;
}

// Global search
export async function searchMusic(query: string): Promise<SearchResponse> {
	return fetchAndDecode<SearchResponse>(
		`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`,
		"Failed to fetch search results",
	);
}

// Paginated search
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

// Songs
export async function getSongById(
	id: string,
): Promise<ApiResponse<DetailedSong[]>> {
	return fetchAndDecode<ApiResponse<DetailedSong[]>>(
		`${API_BASE_URL}/songs/${id}`,
		"Failed to fetch song",
	);
}

export async function getSongsByIds(
	ids: string[],
): Promise<ApiResponse<DetailedSong[]>> {
	return fetchAndDecode<ApiResponse<DetailedSong[]>>(
		`${API_BASE_URL}/songs?ids=${ids.join(",")}`,
		"Failed to fetch songs",
	);
}

export async function getSongSuggestions(
	id: string,
	limit = 10,
): Promise<ApiResponse<DetailedSong[]>> {
	return fetchAndDecode<ApiResponse<DetailedSong[]>>(
		`${API_BASE_URL}/songs/${id}/suggestions?limit=${limit}`,
		"Failed to fetch song suggestions",
	);
}

// Albums
export async function getAlbumById(
	id: string,
): Promise<ApiResponse<DetailedAlbum>> {
	return fetchAndDecode<ApiResponse<DetailedAlbum>>(
		`${API_BASE_URL}/albums?id=${id}`,
		"Failed to fetch album",
	);
}

// Artists
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

	return fetchAndDecode<ApiResponse<DetailedArtist>>(
		`${API_BASE_URL}/artists?${params.toString()}`,
		"Failed to fetch artist",
	);
}

export async function getArtistSongs(
	id: string,
	page = 0,
	sortBy: "popularity" | "latest" | "alphabetical" = "popularity",
	sortOrder: "asc" | "desc" = "desc",
): Promise<ApiResponse<{ total: number; songs: DetailedSong[] }>> {
	return fetchAndDecode<ApiResponse<{ total: number; songs: DetailedSong[] }>>(
		`${API_BASE_URL}/artists/${id}/songs?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
		"Failed to fetch artist songs",
	);
}

export async function getArtistAlbums(
	id: string,
	page = 0,
	sortBy: "popularity" | "latest" | "alphabetical" = "popularity",
	sortOrder: "asc" | "desc" = "desc",
): Promise<ApiResponse<{ total: number; albums: DetailedAlbum[] }>> {
	return fetchAndDecode<
		ApiResponse<{ total: number; albums: DetailedAlbum[] }>
	>(
		`${API_BASE_URL}/artists/${id}/albums?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
		"Failed to fetch artist albums",
	);
}

// Playlists
export async function getPlaylistById(
	id: string,
	page = 0,
	limit = 10,
): Promise<ApiResponse<DetailedPlaylist>> {
	return fetchAndDecode<ApiResponse<DetailedPlaylist>>(
		`${API_BASE_URL}/playlists?id=${id}&page=${page}&limit=${limit}`,
		"Failed to fetch playlist",
	);
}
