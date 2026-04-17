/**
 * Zod Validation Schemas
 * Runtime validation schemas for API responses and form data
 * Derived from TypeScript types but allow runtime validation
 */

import { z } from "zod";
import {
	ArtistRole,
	AudioQuality,
	EntityType,
	ImageQuality,
	Language,
} from "@/types/entity";

/**
 * Image schema - consistent across all entities
 */
export const ImageSchema = z.object({
	quality: z.enum(ImageQuality),
	url: z.url(),
});

/**
 * DownloadUrl schema - audio quality and URL
 */
export const DownloadUrlSchema = z.object({
	quality: z.nativeEnum(AudioQuality),
	url: z.url(),
});

/**
 * ArtistMini schema - minimal artist info (used in lists)
 */
export const ArtistMiniSchema = z.object({
	id: z.string(),
	name: z.string(),
	role: z.union([z.nativeEnum(ArtistRole), z.string()]),
	type: z.union([z.nativeEnum(EntityType), z.string()]),
	image: z.array(ImageSchema),
	url: z.url(),
});

/**
 * AlbumMini schema - minimal album info
 */
export const AlbumMiniSchema = z.object({
	id: z.string().nullable(),
	name: z.string().nullable(),
	url: z.url().nullable(),
});

/**
 * Bio schema - artist bio information
 */
export const BioSchema = z.object({
	text: z.string().nullable(),
	title: z.string().nullable(),
	sequence: z.number().nullable(),
});

/**
 * Artists object schema (primary, featured, all)
 */
export const ArtistsGroupSchema = z.object({
	primary: z.array(ArtistMiniSchema),
	featured: z.array(ArtistMiniSchema),
	all: z.array(ArtistMiniSchema),
});

/**
 * DetailedSong schema - full song information with download links
 */
export const DetailedSongSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: z.union([z.nativeEnum(EntityType), z.string()]),
	year: z.string().nullable(),
	releaseDate: z.string().nullable(),
	duration: z.number().nullable(),
	label: z.string().nullable(),
	explicitContent: z.boolean(),
	playCount: z.number().nullable(),
	language: z.union([z.nativeEnum(Language), z.string()]),
	hasLyrics: z.boolean(),
	lyricsId: z.string().nullable(),
	url: z.url(),
	copyright: z.string().nullable(),
	album: AlbumMiniSchema,
	artists: ArtistsGroupSchema,
	image: z.array(ImageSchema),
	downloadUrl: z.array(DownloadUrlSchema),
});

/**
 * DetailedAlbum schema
 */
export const DetailedAlbumSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	year: z.number().nullable(),
	type: z.union([z.nativeEnum(EntityType), z.string()]),
	playCount: z.number().nullable(),
	language: z.union([z.nativeEnum(Language), z.string()]),
	explicitContent: z.boolean(),
	artists: ArtistsGroupSchema,
	songCount: z.number().nullable(),
	url: z.url(),
	image: z.array(ImageSchema),
	songs: z.array(DetailedSongSchema),
});

/**
 * DetailedArtist schema
 */
export const DetailedArtistSchema = z.object({
	id: z.string(),
	name: z.string(),
	url: z.url(),
	type: z.union([z.nativeEnum(EntityType), z.string()]),
	image: z.array(ImageSchema),
	followerCount: z.number().nullable(),
	fanCount: z.string().nullable(),
	isVerified: z.boolean().nullable(),
	dominantLanguage: z.union([z.nativeEnum(Language), z.string()]).nullable(),
	dominantType: z.union([z.nativeEnum(EntityType), z.string()]).nullable(),
	bio: z.array(BioSchema).nullable(),
	dob: z.string().nullable(),
	fb: z.string().nullable(),
	twitter: z.string().nullable(),
	wiki: z.string().nullable(),
	availableLanguages: z.array(z.string()),
	isRadioPresent: z.boolean().nullable(),
	topSongs: z.array(DetailedSongSchema).nullable(),
	topAlbums: z.array(DetailedAlbumSchema).nullable(),
	singles: z.array(DetailedSongSchema).nullable(),
	similarArtists: z.array(ArtistMiniSchema).nullable(),
});

/**
 * DetailedPlaylist schema
 */
export const DetailedPlaylistSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	year: z.number().nullable(),
	type: z.union([z.nativeEnum(EntityType), z.string()]),
	playCount: z.number().nullable(),
	language: z.union([z.nativeEnum(Language), z.string()]),
	explicitContent: z.boolean(),
	songCount: z.number().nullable(),
	url: z.url(),
	image: z.array(ImageSchema),
	songs: z.array(DetailedSongSchema),
	artists: z.array(ArtistMiniSchema),
});

/**
 * LocalPlaylist schema - user-created playlists
 */
export const LocalPlaylistSchema = z.object({
	id: z.string(),
	name: z.string().min(1, "Playlist name cannot be empty"),
	songs: z.array(DetailedSongSchema),
	createdAt: z.number(),
	updatedAt: z.number(),
});

/**
 * API Response schemas
 */

/**
 * Paginated response schema for search results
 */
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(
	itemSchema: T,
) {
	return z.object({
		results: z.array(itemSchema), // Results array, type depends on context
		total: z.number(),
		start: z.number(),
		count: z.number(),
	});
}

/**
 * Search response schema
 */
export const SearchResponseSchema = z.object({
	songs: z.object({
		results: z.array(DetailedSongSchema),
		position: z.number(),
	}),
	albums: z.object({
		results: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				description: z.string().optional(),
				url: z.string(),
				year: z.number(),
				type: z.union([z.nativeEnum(EntityType), z.string()]),
				artists: ArtistsGroupSchema.optional(),
				image: z.array(ImageSchema),
			}),
		),
		position: z.number(),
	}),
	artists: z.object({
		results: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				url: z.string(),
				image: z.array(ImageSchema),
				type: z.union([z.nativeEnum(EntityType), z.string()]),
			}),
		),
		position: z.number(),
	}),
	playlists: z.object({
		results: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				type: z.union([z.nativeEnum(EntityType), z.string()]),
				image: z.array(ImageSchema),
				url: z.string(),
				songCount: z.number(),
				language: z.union([z.nativeEnum(Language), z.string()]),
			}),
		),
		position: z.number(),
	}),
});

/**
 * Type exports for use in components
 */
export type Image = z.infer<typeof ImageSchema>;
export type DownloadUrl = z.infer<typeof DownloadUrlSchema>;
export type ArtistMini = z.infer<typeof ArtistMiniSchema>;
export type AlbumMini = z.infer<typeof AlbumMiniSchema>;
export type DetailedSong = z.infer<typeof DetailedSongSchema>;
export type DetailedAlbum = z.infer<typeof DetailedAlbumSchema>;
export type DetailedArtist = z.infer<typeof DetailedArtistSchema>;
export type DetailedPlaylist = z.infer<typeof DetailedPlaylistSchema>;
export type LocalPlaylist = z.infer<typeof LocalPlaylistSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

/**
 * Safe parse wrapper - returns data or null on validation failure
 */
export function parseEntity<T>(
	schema: z.ZodSchema<T>,
	data: unknown,
): T | null {
	const result = schema.safeParse(data);
	return result.success ? result.data : null;
}
