/**
 * Storage Migration Utilities
 * Tools for migrating data between versions or exporting/importing
 */

import { debug, logWarning } from "@/lib/utils/logger";
import type { Migration } from "./config";
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
 * Version-specific migrations
 */
const MIGRATIONS: Migration[] = [
	{
		fromVersion: "0.0.0",
		toVersion: "1.0.0",
		migrate: (data: unknown): unknown => {
			const appData = data as Record<string, unknown>;
			if (appData["music-app-queue"]) {
				try {
					const queueData = JSON.parse(appData["music-app-queue"] as string);
					if (queueData.songs && Array.isArray(queueData.songs)) {
						queueData.songs = queueData.songs.map(
							(song: Record<string, unknown>) => ({
								...song,
								migrated: true,
								migratedAt: Date.now(),
							}),
						);
					}
					return queueData;
				} catch {
					return appData["music-app-queue"];
				}
			}
			return data;
		},
	},
];

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
	}
}

/**
 * Clear all storage and bump version (for complete cache bust)
 */
export async function bustCache(): Promise<void> {
	await storage.clearAll();
	storage.bumpVersion();
	debug("Storage", "Cache busted! Storage version:", STORAGE_VERSION);
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
	debug("Storage", "Data imported successfully");
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
	const idbKeys = Object.keys(storage.getBackend("MAIN") || {});
	for (const key of idbKeys) {
		await storage.clear(key);
	}
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

	migrateLegacyKeys();

	let migratedData: Record<string, unknown> = {};

	try {
		const allData = await storage.exportData();
		for (const [key, value] of Object.entries(allData.localStorage)) {
			migratedData[key] = value;
		}
	} catch {
		logWarning("StorageMigration", "Could not export data for migration");
	}

	for (const migration of MIGRATIONS) {
		if (storage.versionCompare(currentVersion, migration.fromVersion) <= 0) {
			continue;
		}
		if (storage.versionCompare(migration.toVersion, STORAGE_VERSION) > 0) {
			continue;
		}

		debug(
			"StorageMigration",
			`Running from ${migration.fromVersion} to ${migration.toVersion}`,
		);
		migratedData =
			(migration.migrate(migratedData) as Record<string, unknown>) ||
			migratedData;
	}

	storage.bumpVersion();

	return { version: STORAGE_VERSION, migrated: true };
}

/**
 * Print storage status to console (useful for debugging)
 */
export function logStorageStatus(): void {
	debug("Storage", "Version:", getStorageVersion());
	debug("Storage", "Needs Migration:", needsMigration());

	if (typeof window !== "undefined") {
		debug(
			"Storage",
			"localStorage Keys:",
			Object.keys(localStorage).filter((k) => k.startsWith("music-app")),
		);
	}

	getStorageEstimate().then((estimate) => {
		debug("Storage", "Estimate:", estimate);
	});
}

/**
 * Register version-specific migrations
 */
export function registerMigrations(migrations: Migration[]): void {
	for (const migration of migrations) {
		storage.addMigration(migration);
	}
}

/**
 * Get list of all registered migrations
 */
export function getRegisteredMigrations(): Migration[] {
	return [...MIGRATIONS];
}
