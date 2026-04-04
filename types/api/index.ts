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
	albums: SearchResultSection<Album>;
	songs: SearchResultSection<Song>;
	artists: SearchResultSection<Artist>;
	playlists: SearchResultSection<Playlist>;
	topQuery: SearchResultSection<Song | Artist>;
}

export interface ApiResponse<T> {
	success: boolean;
	data: T;
}

export type AlbumResponse = DetailedAlbum;
export type ArtistResponse = DetailedArtist;
export type PlaylistResponse = DetailedPlaylist;
export type SongsResponse = DetailedSong[];
export type PaginatedSongsResponse = {
	total: number;
	songs: DetailedSong[];
};
export type SearchSongsResponse = {
	total: number;
	results: DetailedSong[];
};
