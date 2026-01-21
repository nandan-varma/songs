/**
 * Storage Module
 * Centralized storage management for the music app
 *
 * @example
 * import { storage, queueStorage, playlistsStorage } from "@/lib/storage";
 *
 * // Clear all storage (cache bust)
 * await storage.clearAll();
 *
 * // Export data for backup
 * const backup = await storage.exportData();
 *
 * // Save queue
 * queueStorage.save(songs, 0);
 */

export { favoritesStorage } from "./adapters/favorites";
export { historyStorage } from "./adapters/history";
export { playlistsStorage } from "./adapters/playlists";

// Adapters
export { queueStorage } from "./adapters/queue";
export { recentlyPlayedStorage } from "./adapters/recently-played";
export { searchHistoryStorage } from "./adapters/search-history";
// Configuration
export * from "./config";
// Core storage manager
export { storage } from "./core";
// Migration utilities
export {
	bustCache,
	clearLocalStorageOnly,
	exportForBackup,
	getStorageEstimate,
	getStorageVersion,
	importFromBackup,
	logStorageStatus,
	migrateLegacyKeys,
	needsMigration,
	runFullMigration,
} from "./migrate";
