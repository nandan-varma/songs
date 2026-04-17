// Cache keys for all entities
export const CACHE_KEYS = {
	SONGS: (id: string) => ["song", id] as const,
	SONGS_BY_IDS: (ids: string[]) => ["songs", ...ids] as const,
	ALBUM: (id: string) => ["album", id] as const,
	ARTIST: (id: string) => ["artist", id] as const,
	PLAYLIST: (id: string) => ["playlist", id] as const,
	SEARCH: (query: string) => ["search", query] as const,
	SEARCH_SONGS: (query: string, limit: number) =>
		["search-songs", query, limit] as const,
	SEARCH_ALBUMS: (query: string, limit: number) =>
		["search-albums", query, limit] as const,
	SEARCH_ARTISTS: (query: string, limit: number) =>
		["search-artists", query, limit] as const,
	SEARCH_PLAYLISTS: (query: string, limit: number) =>
		["search-playlists", query, limit] as const,
	SUGGESTIONS: (id: string, limit: number) =>
		["suggestions", id, limit] as const,
	ARTIST_SONGS: (id: string, sortBy: string, sortOrder: string) =>
		["artist-songs", id, sortBy, sortOrder] as const,
	ARTIST_ALBUMS: (id: string, sortBy: string, sortOrder: string) =>
		["artist-albums", id, sortBy, sortOrder] as const,
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
	PLAYLIST: 1000 * 60 * 10, // 10 min
	SEARCH: 1000 * 60 * 1, // 1 min
	DOWNLOADS: 1000 * 60 * 60, // 1 hour
	QUEUE: 1000 * 60 * 60, // 1 hour
	HISTORY: 1000 * 60 * 60, // 1 hour
	FAVORITES: 1000 * 60 * 60, // 1 hour
	RECENTLY_PLAYED: 1000 * 60 * 60, // 1 hour
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
