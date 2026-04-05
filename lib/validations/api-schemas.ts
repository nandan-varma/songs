/**
 * Zod schemas for API validation
 * @module lib/validations/api-schemas
 */

import { z } from "zod";

// ============ BASE SCHEMAS ============
const ImageSchema = z.object({
	quality: z.string(),
	url: z.string().url(),
});

const ArtistMiniSchema = z.object({
	id: z.string(),
	name: z.string(),
	role: z.string(),
	type: z.string(),
	image: z.array(ImageSchema),
	url: z.string(),
});

const AlbumMiniSchema = z.object({
	id: z.string().nullable(),
	name: z.string().nullable(),
	url: z.string().nullable(),
});

const DownloadUrlSchema = z.object({
	quality: z.string(),
	url: z.string().url(),
});

// ============ ENTITY SCHEMAS ============
export const DetailedSongSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: z.string(),
	year: z.string().nullable(),
	releaseDate: z.string().nullable(),
	duration: z.number().nullable(),
	label: z.string().nullable(),
	explicitContent: z.boolean(),
	playCount: z.number().nullable(),
	language: z.string(),
	hasLyrics: z.boolean(),
	lyricsId: z.string().nullable(),
	url: z.string(),
	copyright: z.string().nullable(),
	album: AlbumMiniSchema,
	artists: z.object({
		primary: z.array(ArtistMiniSchema),
		featured: z.array(ArtistMiniSchema),
		all: z.array(ArtistMiniSchema),
	}),
	image: z.array(ImageSchema),
	downloadUrl: z.array(DownloadUrlSchema),
});

export const DetailedAlbumSchema = z.object({
	id: z.string(),
	title: z.string(),
	image: z.array(ImageSchema),
	artist: z.string(),
	url: z.string(),
	type: z.string(),
	description: z.string(),
	year: z.string(),
	language: z.string(),
	songs: z.array(DetailedSongSchema).optional(),
	songIds: z.string().optional(),
});

export const DetailedArtistSchema = z.object({
	id: z.string(),
	title: z.string(),
	image: z.array(ImageSchema),
	type: z.string(),
	description: z.string(),
	topSongs: z.array(DetailedSongSchema).optional(),
	topAlbums: z.array(DetailedAlbumSchema).optional(),
	position: z.number().optional(),
});

export const DetailedPlaylistSchema = z.object({
	id: z.string(),
	title: z.string(),
	image: z.array(ImageSchema),
	url: z.string(),
	language: z.string(),
	type: z.string(),
	description: z.string(),
	songs: z.array(DetailedSongSchema).optional(),
});

// ============ SEARCH RESULT SCHEMAS ============
export const AlbumSearchResultSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	url: z.string(),
	year: z.number(),
	type: z.string(),
	playCount: z.number().nullable(),
	language: z.string(),
	explicitContent: z.boolean(),
	artists: z.object({
		primary: z.array(ArtistMiniSchema),
		featured: z.array(ArtistMiniSchema),
		all: z.array(ArtistMiniSchema),
	}),
	image: z.array(ImageSchema),
});

export const ArtistSearchResultSchema = z.object({
	id: z.string(),
	name: z.string(),
	role: z.string(),
	image: z.array(ImageSchema),
	type: z.string(),
	url: z.string(),
});

export const PlaylistSearchResultSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: z.string(),
	image: z.array(ImageSchema),
	url: z.string(),
	songCount: z.number(),
	language: z.string(),
	explicitContent: z.boolean(),
});

// ============ RESPONSE SCHEMAS ============
export const PaginatedResponseSchema = z.object({
	results: z.array(z.unknown()),
	total: z.number(),
	start: z.number(),
	count: z.number(),
});

export const SearchResponseSchema = z.object({
	songs: z.object({
		results: z.array(DetailedSongSchema),
		total: z.number(),
		start: z.number(),
		count: z.number(),
	}),
	albums: z.object({
		results: z.array(AlbumSearchResultSchema),
		total: z.number(),
		start: z.number(),
		count: z.number(),
	}),
	artists: z.object({
		results: z.array(ArtistSearchResultSchema),
		total: z.number(),
		start: z.number(),
		count: z.number(),
	}),
	playlists: z.object({
		results: z.array(PlaylistSearchResultSchema),
		total: z.number(),
		start: z.number(),
		count: z.number(),
	}),
});

// ============ EXPORT TYPES ============
export type ValidatedDetailedSong = z.infer<typeof DetailedSongSchema>;
export type ValidatedDetailedAlbum = z.infer<typeof DetailedAlbumSchema>;
export type ValidatedDetailedArtist = z.infer<typeof DetailedArtistSchema>;
export type ValidatedDetailedPlaylist = z.infer<typeof DetailedPlaylistSchema>;
export type ValidatedSearchResponse = z.infer<typeof SearchResponseSchema>;
