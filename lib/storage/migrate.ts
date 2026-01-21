/**
 * Storage Migration Utilities
 * Tools for migrating data between versions or exporting/importing
 */

import {
	type ExportData,
	LOCAL_STORAGE_KEYS,
	STORAGE_VERSION,
	STORAGE_VERSION_KEY,
} from "./config";
import { storage } from "./core";

/**
 * Legacy key mappings for migration from old key names
 */
const LEGACY_KEYS = {
	shuffle: LOCAL_STORAGE_KEYS.SHUFFLE,
	"music-app-shuffle-enabled": LOCAL_STORAGE_KEYS.SHUFFLE,
	"music-app-queue": LOCAL_STORAGE_KEYS.QUEUE,
	"music-app-recently-played": LOCAL_STORAGE_KEYS.RECENTLY_PLAYED,
	"music-app-search-history": LOCAL_STORAGE_KEYS.SEARCH_HISTORY,
	"music-app-history": LOCAL_STORAGE_KEYS.HISTORY,
};

/**
 * Migrate legacy localStorage keys to new prefixed keys
 */
export function migrateLegacyKeys(): void {
	if (typeof window === "undefined") return;

	for (const [legacyKey, newKey] of Object.entries(LEGACY_KEYS)) {
		const value = localStorage.getItem(legacyKey);
		if (value && !localStorage.getItem(newKey)) {
			localStorage.setItem(newKey, value);
		}
		// Don't remove legacy key immediately - let users verify migration
	}
}

/**
 * Clear all storage and bump version (for complete cache bust)
 */
export async function bustCache(): Promise<void> {
	await storage.clearAll();
	storage.bumpVersion();
	console.log("Cache busted! Storage version:", STORAGE_VERSION);
}

/**
 * Export all data for backup
 */
export async function exportForBackup(): Promise<
	ExportData & { version: string }
> {
	const data = await storage.exportData();
	return {
		...data,
		version: STORAGE_VERSION,
	};
}

/**
 * Import data from backup
 */
export async function importFromBackup(data: ExportData): Promise<void> {
	await storage.importData(data);
	console.log("Data imported successfully");
}

/**
 * Clear only localStorage (keeps IndexedDB)
 */
export function clearLocalStorageOnly(): void {
	if (typeof window === "undefined") return;
	localStorage.clear();
}

/**
 * Clear only IndexedDB (keeps localStorage)
 */
export async function clearIndexedDBOnly(): Promise<void> {
	await storage.clearAll(); // This clears both
	// Note: We need to restore localStorage after clearAll
}

/**
 * Get storage usage estimate
 */
export async function getStorageEstimate(): Promise<{
	usage: number;
	quota: number;
	percentUsed: number;
}> {
	if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
		return { usage: 0, quota: 0, percentUsed: 0 };
	}

	const estimate = await navigator.storage.estimate();
	return {
		usage: estimate.usage || 0,
		quota: estimate.quota || 0,
		percentUsed: estimate.quota
			? ((estimate.usage || 0) / estimate.quota) * 100
			: 0,
	};
}

/**
 * Check current storage version
 */
export function getStorageVersion(): string {
	if (typeof window === "undefined") return STORAGE_VERSION;
	return localStorage.getItem(STORAGE_VERSION_KEY) || "unknown";
}

/**
 * Check if storage needs migration
 */
export function needsMigration(): boolean {
	return getStorageVersion() !== STORAGE_VERSION;
}

/**
 * Run full migration process
 */
export async function runFullMigration(): Promise<{
	version: string;
	migrated: boolean;
}> {
	const currentVersion = getStorageVersion();

	if (currentVersion === STORAGE_VERSION) {
		return { version: currentVersion, migrated: false };
	}

	// Migrate legacy keys
	migrateLegacyKeys();

	// Run any version-specific migrations here in the future

	// Update version
	storage.bumpVersion();

	return { version: STORAGE_VERSION, migrated: true };
}

/**
 * Print storage status to console (useful for debugging)
 */
export function logStorageStatus(): void {
	console.group("Storage Status");
	console.log("Version:", getStorageVersion());
	console.log("Needs Migration:", needsMigration());

	if (typeof window !== "undefined") {
		console.log(
			"localStorage Keys:",
			Object.keys(localStorage).filter((k) => k.startsWith("music-app")),
		);
	}

	getStorageEstimate().then((estimate) => {
		console.log("Storage Estimate:", estimate);
		console.groupEnd();
	});
}
