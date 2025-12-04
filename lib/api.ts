import {
  SearchResponse,
  ApiResponse,
  DetailedSong,
  DetailedAlbum,
  DetailedArtist,
  DetailedPlaylist,
  PaginatedResponse,
  AlbumSearchResult,
  ArtistSearchResult,
  PlaylistSearchResult,
} from './types';

const API_BASE_URL = 'https://saavn-api.nandanvarma.com/api';

// Global search
export async function searchMusic(query: string): Promise<SearchResponse> {
  const response = await fetch(
    `${API_BASE_URL}/search?query=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch search results');
  }

  return response.json();
}

// Paginated search
export async function searchSongs(
  query: string,
  page = 0,
  limit = 10
): Promise<ApiResponse<PaginatedResponse<DetailedSong>>> {
  const response = await fetch(
    `${API_BASE_URL}/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to search songs');
  }

  return response.json();
}

export async function searchAlbums(
  query: string,
  page = 0,
  limit = 10
): Promise<ApiResponse<PaginatedResponse<AlbumSearchResult>>> {
  const response = await fetch(
    `${API_BASE_URL}/search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to search albums');
  }

  return response.json();
}

export async function searchArtists(
  query: string,
  page = 0,
  limit = 10
): Promise<ApiResponse<PaginatedResponse<ArtistSearchResult>>> {
  const response = await fetch(
    `${API_BASE_URL}/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to search artists');
  }

  return response.json();
}

export async function searchPlaylists(
  query: string,
  page = 0,
  limit = 10
): Promise<ApiResponse<PaginatedResponse<PlaylistSearchResult>>> {
  const response = await fetch(
    `${API_BASE_URL}/search/playlists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to search playlists');
  }

  return response.json();
}

// Songs
export async function getSongById(id: string): Promise<ApiResponse<DetailedSong[]>> {
  const response = await fetch(`${API_BASE_URL}/songs/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch song');
  }

  return response.json();
}

export async function getSongsByIds(ids: string[]): Promise<ApiResponse<DetailedSong[]>> {
  const response = await fetch(`${API_BASE_URL}/songs?ids=${ids.join(',')}`);

  if (!response.ok) {
    throw new Error('Failed to fetch songs');
  }

  return response.json();
}

export async function getSongSuggestions(
  id: string,
  limit = 10
): Promise<ApiResponse<DetailedSong[]>> {
  const response = await fetch(
    `${API_BASE_URL}/songs/${id}/suggestions?limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch song suggestions');
  }

  return response.json();
}

// Albums
export async function getAlbumById(id: string): Promise<ApiResponse<DetailedAlbum>> {
  const response = await fetch(`${API_BASE_URL}/albums?id=${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch album');
  }

  return response.json();
}

// Artists
export async function getArtistById(
  id: string,
  options?: {
    page?: number;
    songCount?: number;
    albumCount?: number;
    sortBy?: 'popularity' | 'latest' | 'alphabetical';
    sortOrder?: 'asc' | 'desc';
  }
): Promise<ApiResponse<DetailedArtist>> {
  const params = new URLSearchParams({ id });

  if (options?.page !== undefined) params.append('page', options.page.toString());
  if (options?.songCount) params.append('songCount', options.songCount.toString());
  if (options?.albumCount) params.append('albumCount', options.albumCount.toString());
  if (options?.sortBy) params.append('sortBy', options.sortBy);
  if (options?.sortOrder) params.append('sortOrder', options.sortOrder);

  const response = await fetch(`${API_BASE_URL}/artists?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch artist');
  }

  return response.json();
}

export async function getArtistSongs(
  id: string,
  page = 0,
  sortBy: 'popularity' | 'latest' | 'alphabetical' = 'popularity',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<ApiResponse<{ total: number; songs: DetailedSong[] }>> {
  const response = await fetch(
    `${API_BASE_URL}/artists/${id}/songs?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch artist songs');
  }

  return response.json();
}

export async function getArtistAlbums(
  id: string,
  page = 0,
  sortBy: 'popularity' | 'latest' | 'alphabetical' = 'popularity',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<ApiResponse<{ total: number; albums: DetailedAlbum[] }>> {
  const response = await fetch(
    `${API_BASE_URL}/artists/${id}/albums?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch artist albums');
  }

  return response.json();
}

// Playlists
export async function getPlaylistById(
  id: string,
  page = 0,
  limit = 10
): Promise<ApiResponse<DetailedPlaylist>> {
  const response = await fetch(
    `${API_BASE_URL}/playlists?id=${id}&page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch playlist');
  }

  return response.json();
}
