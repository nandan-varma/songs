/**
 * localStorage utilities with error handling and namespacing
 * All keys are prefixed with "songs:" to avoid conflicts
 */

import { logError } from "./logger";
import { safeJsonParse, safeJsonStringify } from "./normalize-error";

const STORAGE_PREFIX = "songs";

/**
 * Create namespaced storage key
 * @param key - Base key name
 * @returns Prefixed key
 */
function createStorageKey(key: string): string {
	return `${STORAGE_PREFIX}:${key}`;
}

/**
 * Get item from localStorage with error handling
 * @param key - Key to retrieve
 * @param fallback - Value to return if not found or error occurs
 * @returns Stored value or fallback
 */
export function getStorageItem<T>(key: string, fallback: T): T {
	try {
		const fullKey = createStorageKey(key);
		const item = localStorage.getItem(fullKey);

		if (item === null) {
			return fallback;
		}

		return safeJsonParse<T>(item, fallback);
	} catch (error) {
		logError("StorageGet", error);
		return fallback;
	}
}

/**
 * Set item in localStorage with error handling
 * @param key - Key to store under
 * @param value - Value to store
 * @returns True if successful, false otherwise
 */
export function setStorageItem<T>(key: string, value: T): boolean {
	try {
		const fullKey = createStorageKey(key);
		const jsonValue = safeJsonStringify(value);

		if (!jsonValue) {
			logError("StorageSet", new Error("Failed to stringify value"));
			return false;
		}

		localStorage.setItem(fullKey, jsonValue);
		return true;
	} catch (error) {
		logError("StorageSet", error);
		return false;
	}
}

/**
 * Remove item from localStorage with error handling
 * @param key - Key to remove
 * @returns True if successful, false otherwise
 */
export function removeStorageItem(key: string): boolean {
	try {
		const fullKey = createStorageKey(key);
		localStorage.removeItem(fullKey);
		return true;
	} catch (error) {
		logError("StorageRemove", error);
		return false;
	}
}

/**
 * Clear all namespaced items from localStorage
 * @returns Number of items cleared
 */
export function clearStorage(): number {
	try {
		const prefix = `${STORAGE_PREFIX}:`;
		const keys: string[] = [];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith(prefix)) {
				keys.push(key);
			}
		}

		keys.forEach((key) => {
			try {
				localStorage.removeItem(key);
			} catch (error) {
				logError("StorageClear", error);
			}
		});

		return keys.length;
	} catch (error) {
		logError("StorageClear", error);
		return 0;
	}
}

/**
 * Check if localStorage is available and writable
 * @returns True if localStorage is available
 */
export function isStorageAvailable(): boolean {
	try {
		const testKey = `${STORAGE_PREFIX}:test-${Date.now()}`;
		localStorage.setItem(testKey, "test");
		localStorage.removeItem(testKey);
		return true;
	} catch (error) {
		logError("Storage:isAvailable", error);
		return false;
	}
}

/**
 * Get storage space information (if available)
 * @returns Storage quota information or undefined
 */
export async function getStorageInfo(): Promise<
	{ usage: number; quota: number } | undefined
> {
	try {
		if ("storage" in navigator && "estimate" in navigator.storage) {
			const estimate = await navigator.storage.estimate();
			return {
				usage: estimate.usage ?? 0,
				quota: estimate.quota ?? 0,
			};
		}
	} catch (error) {
		logError("StorageInfo", error);
	}

	return undefined;
}

/**
 * Check if storage quota is available
 * @param threshold - Minimum bytes to reserve (default: 1MB)
 * @returns True if storage is below quota
 */
export async function hasStorageSpace(
	threshold = 1024 * 1024,
): Promise<boolean> {
	try {
		const info = await getStorageInfo();
		if (!info) return true;
		return info.quota - info.usage > threshold;
	} catch (error) {
		logError("Storage:hasSpace", error);
		return true;
	}
}
