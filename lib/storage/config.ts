/**
 * Centralized storage configuration
 * All storage keys, database names, versions, and limits in one place
 */

import type { DetailedSong } from "@/types/entity";

// ============================================================================
// VERSIONING - Increment to force cache busting / migrations
// ============================================================================

export const STORAGE_VERSION = "1.0.0";
export const STORAGE_VERSION_KEY = "storage-version";

// ============================================================================
// APP PREFIX - Avoids conflicts with other apps on same domain
// ============================================================================

export const STORAGE_PREFIX = "music-app";

// ============================================================================
// LOCAL STORAGE KEYS
// All keys use STORAGE_PREFIX automatically
// ============================================================================

export const LOCAL_STORAGE_KEYS = {
	SHUFFLE: `${STORAGE_PREFIX}-shuffle`,
	QUEUE: `${STORAGE_PREFIX}-queue`,
	RECENTLY_PLAYED: `${STORAGE_PREFIX}-recently-played`,
	SEARCH_HISTORY: `${STORAGE_PREFIX}-search-history`,
	HISTORY: `${STORAGE_PREFIX}-history`,
	SETTINGS: `${STORAGE_PREFIX}-settings`,
} as const;

export type LocalStorageKey =
	(typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS];

// ============================================================================
// INDEXED DB CONFIGURATION
// ============================================================================

export const INDEXED_DB = {
	MAIN: {
		NAME: `${STORAGE_PREFIX}-main`,
		VERSION: 1,
		STORES: {
			SONGS: "songs",
			AUDIO: "audio",
			IMAGES: "images",
		} as const,
	},
	PLAYLISTS: {
		NAME: `${STORAGE_PREFIX}-playlists`,
		VERSION: 3,
		STORES: {
			PLAYLISTS: "playlists",
		} as const,
	},
	FAVORITES: {
		NAME: `${STORAGE_PREFIX}-favorites`,
		VERSION: 1,
		STORES: {
			FAVORITES: "favorites",
		} as const,
	},
} as const;

export type IndexedDBName = keyof typeof INDEXED_DB;

// ============================================================================
// STORAGE LIMITS
// ============================================================================

export const LIMITS = {
	// Queue expires after 7 days
	QUEUE_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000,
	// Recently played items
	MAX_RECENT_ITEMS: 50,
	// Search history items
	MAX_SEARCH_HISTORY: 10,
	// Browsing history items
	MAX_HISTORY_ITEMS: 100,
} as const;

// ============================================================================
// DATA TYPES
// Used for type-safe storage operations
// ============================================================================

export interface SavedQueue {
	songs: DetailedSong[];
	currentIndex: number;
	savedAt: number;
	[key: string]: unknown;
}

export interface RecentlyPlayedItem {
	songId: string;
	title: string;
	artist: string;
	image?: string;
	album?: string;
	duration?: number;
	playedAt: string;
}

export interface SearchHistoryItem {
	query: string;
	timestamp: number;
}

export interface HistoryItem {
	id: string;
	type: "song" | "album" | "artist" | "playlist";
	data: unknown;
	timestamp: string;
}

export interface UserSettings {
	audioQuality: "low" | "medium" | "high";
	darkMode: boolean;
	autoPlay: boolean;
	volume: number;
}

export interface FavoriteItem {
	song: DetailedSong;
	addedAt: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
	[key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

// ============================================================================
// STORAGE BACKENDS (for future API integration)
// ============================================================================

export type StorageBackendType = "localStorage" | "indexedDB" | "remoteAPI";

export interface RemoteAPIConfig {
	baseUrl: string;
	apiKey?: string;
	headers?: Record<string, string>;
}

export interface StorageBackendConfig {
	type: StorageBackendType;
	remote?: RemoteAPIConfig;
}

// ============================================================================
// MIGRATION TYPES
// ============================================================================

export interface Migration {
	fromVersion: string;
	toVersion: string;
	migrate: (data: unknown) => unknown;
}

export interface ExportData {
	version: string;
	timestamp: number;
	localStorage: Record<string, JsonValue>;
	indexedDB: Record<string, Record<string, JsonValue[]>>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if running in browser
 */
export function isBrowser(): boolean {
	return typeof window !== "undefined";
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
	if (!isBrowser()) return false;
	try {
		const test = "__storage_test__";
		localStorage.setItem(test, test);
		localStorage.removeItem(test);
		return true;
	} catch {
		return false;
	}
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
	if (!isBrowser()) return false;
	try {
		return "indexedDB" in window;
	} catch {
		return false;
	}
}
