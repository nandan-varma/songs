/**
 * API response types for the music streaming application
 * @module types/api
 */

import type {
	Album,
	AlbumSearchResult,
	Artist,
	ArtistSearchResult,
	Chart,
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
	DetailedSong,
	Lyrics,
	Playlist,
	PlaylistSearchResult,
	RadioStation,
} from "../entity";

export type {
	Album,
	AlbumSearchResult,
	Artist,
	ArtistSearchResult,
	Chart,
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
	DetailedSong,
	Lyrics,
	Playlist,
	PlaylistSearchResult,
	RadioStation,
};

export interface PaginatedResponse<T> {
	total: number;
	start: number;
	results: T[];
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
