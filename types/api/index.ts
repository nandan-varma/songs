/**
 * API response types for the music streaming application
 * @module types/api
 */

import type {
	Album,
	AlbumSearchResult,
	Artist,
	ArtistSearchResult,
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
	DetailedSong,
	Playlist,
	PlaylistSearchResult,
	Song,
} from "../entity";

export type {
	Album,
	AlbumSearchResult,
	Artist,
	ArtistSearchResult,
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
	DetailedSong,
	Playlist,
	PlaylistSearchResult,
	Song,
};

export interface SearchResultSection<T> {
	results: T[];
	position: number;
}

export interface PaginatedResponse<T> {
	total: number;
	start: number;
	results: T[];
}

export interface SearchResponse {
	success: boolean;
	data: {
		albums: SearchResultSection<Album>;
		songs: SearchResultSection<Song>;
		artists: SearchResultSection<Artist>;
		playlists: SearchResultSection<Playlist>;
		topQuery: SearchResultSection<Song | Artist>;
	};
}

export interface ApiResponse<T> {
	success: boolean;
	data: T;
}

export type AlbumResponse = ApiResponse<DetailedAlbum>;
export type ArtistResponse = ApiResponse<DetailedArtist>;
export type PlaylistResponse = ApiResponse<DetailedPlaylist>;
export type SongsResponse = ApiResponse<DetailedSong[]>;
export type PaginatedSongsResponse = ApiResponse<{
	total: number;
	songs: DetailedSong[];
}>;
export type SearchSongsResponse = ApiResponse<{
	total: number;
	results: DetailedSong[];
}>;
