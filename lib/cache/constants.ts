// Cache keys for all entities
export const CACHE_KEYS = {
	SONGS: (id: string) => ["song", id] as const,
	ALBUM: (id: string) => ["album", id] as const,
	ARTIST: (id: string) => ["artist", id] as const,
	PLAYLIST: (id: string) => ["playlist", id] as const,
	SEARCH: (query: string) => ["search", query] as const,
	DOWNLOADS: (id: string) => ["downloads", id] as const,
	ALL_DOWNLOADS: ["downloads"] as const,
	QUEUE: ["queue"] as const,
	HISTORY: ["history"] as const,
	FAVORITES: ["favorites"] as const,
	RECENTLY_PLAYED: ["recently_played"] as const,
} as const;

// Cache timing strategy (in milliseconds)
export const CACHE_TIMES = {
	SONG: 1000 * 60 * 10, // 10 min
	ALBUM: 1000 * 60 * 10, // 10 min
	ARTIST: 1000 * 60 * 10, // 10 min
	SEARCH: 1000 * 60 * 1, // 1 min
	DOWNLOADS: Infinity, // Never invalidate
	QUEUE: Infinity,
	HISTORY: Infinity,
	FAVORITES: Infinity,
	RECENTLY_PLAYED: Infinity,
} as const;

// IndexedDB storage config
export const STORAGE_CONFIG = {
	DB_NAME: "MusicAppDB",
	VERSION: 1,
	STORES: {
		SONGS: "songs",
		AUDIO: "audio",
		IMAGES: "images",
		METADATA: "metadata",
		CACHE: "cache",
	},
	LIMITS: {
		MAX_SONGS: 100,
		MAX_SIZE_MB: 500,
		MAX_CACHE_ITEMS: 1000,
	},
} as const;

// localStorage keys
export const LOCAL_STORAGE_KEYS = {
	QUEUE: "music_queue",
	HISTORY: "music_history",
	FAVORITES: "music_favorites",
	SEARCH_HISTORY: "music_search_history",
	PLAYLISTS: "music_playlists",
	RECENTLY_PLAYED: "music_recently_played",
	BUILD_ID: "music_build_id",
} as const;

// Type helpers
export type CacheKey = string | readonly (string | number)[];
export type CacheTime = number | typeof Infinity;

// Service Worker cache names
export const SW_CACHE_NAMES = {
	STATIC: "static-v1",
	DYNAMIC: "dynamic-v1",
	IMAGES: "images-v1",
} as const;
