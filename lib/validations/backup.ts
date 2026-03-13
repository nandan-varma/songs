import { z } from "zod";

export const BackupDataSchema = z.object({
	version: z.string(),
	timestamp: z.number(),
	localStorage: z.record(z.string(), z.unknown()).optional(),
	indexedDB: z
		.record(z.string(), z.record(z.string(), z.array(z.unknown())))
		.optional(),
});

export type BackupData = z.infer<typeof BackupDataSchema>;

/**
 * Schema for individual data items that can be imported
 */
export const FavoriteItemSchema = z.object({
	id: z.string(),
	type: z.enum(["song", "album", "artist"]),
});

export const PlaylistItemSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(100),
	songIds: z.array(z.string()),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
});

export const HistoryItemSchema = z.object({
	songId: z.string(),
	playedAt: z.string().datetime(),
	duration: z.number().optional(),
});

export type FavoriteItem = z.infer<typeof FavoriteItemSchema>;
export type PlaylistItem = z.infer<typeof PlaylistItemSchema>;
export type HistoryItem = z.infer<typeof HistoryItemSchema>;

/**
 * Input validation constants
 */
export const VALIDATION = {
	SEARCH_QUERY: { min: 1, max: 500 } as const,
	PLAYLIST_NAME: { min: 1, max: 100 } as const,
	IMPORT_SIZE: { max: 10 * 1024 * 1024 } as const, // 10MB
	SONG_TITLE: { min: 1, max: 500 } as const,
	ARTIST_NAME: { min: 1, max: 200 } as const,
	ALBUM_NAME: { min: 1, max: 300 } as const,
} as const;

/**
 * Validate search query length
 */
export function isValidSearchQuery(query: string): boolean {
	return (
		query.length >= VALIDATION.SEARCH_QUERY.min &&
		query.length <= VALIDATION.SEARCH_QUERY.max
	);
}

/**
 * Validate playlist name
 */
export function isValidPlaylistName(name: string): boolean {
	return (
		name.length >= VALIDATION.PLAYLIST_NAME.min &&
		name.length <= VALIDATION.PLAYLIST_NAME.max
	);
}

/**
 * Sanitize search query - remove potentially dangerous characters
 */
export function sanitizeSearchQuery(query: string): string {
	const sanitized = query.trim();
	const invalidChars: number[] = [];
	for (let i = 0; i < sanitized.length; i++) {
		const charCode = sanitized.charCodeAt(i);
		if (charCode < 32 || charCode === 127) {
			invalidChars.push(i);
		}
	}
	let result = sanitized;
	for (const idx of invalidChars.sort((a, b) => b - a)) {
		result = result.slice(0, idx) + result.slice(idx + 1);
	}
	return result.slice(0, VALIDATION.SEARCH_QUERY.max);
}
