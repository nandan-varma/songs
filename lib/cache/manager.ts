import type { QueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { type CacheKey, type CacheTime, STORAGE_CONFIG } from "./constants";

/**
 * Unified cache manager that coordinates memory (Query), IndexedDB, and localStorage.
 * Implements a tiered caching strategy:
 * 1. Try Query cache (fast, in-memory)
 * 2. Try IndexedDB (persistent, media storage)
 * 3. Try localStorage (lightweight, metadata)
 * 4. Fallback to queryFn (network request)
 */
class CacheManager {
	private db: IDBDatabase | null = null;
	private initPromise: Promise<void> | null = null;

	/**
	 * Initialize IndexedDB connection and stores
	 */
	async init(): Promise<void> {
		if (this.initPromise) return this.initPromise;

		this.initPromise = new Promise<void>((resolve, reject) => {
			const request = indexedDB.open(
				STORAGE_CONFIG.DB_NAME,
				STORAGE_CONFIG.VERSION,
			);

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				for (const store of Object.values(STORAGE_CONFIG.STORES)) {
					if (!db.objectStoreNames.contains(store)) {
						db.createObjectStore(store);
					}
				}
			};

			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};

			request.onerror = () => reject(request.error);
		});

		return this.initPromise;
	}

	/**
	 * Get value from cache with fallback chain
	 */
	async get<T>(
		key: CacheKey,
		store: keyof typeof STORAGE_CONFIG.STORES = "METADATA",
	): Promise<T | null> {
		const keyStr = this.stringifyKey(key);

		// 1. Try Query cache first (fastest)
		const queryKey = Array.isArray(key) ? key : [key];
		const queryData = queryClient.getQueryData<T>(queryKey);
		if (queryData) return queryData;

		// 2. Try IndexedDB
		if (!this.db) await this.init();
		const idbData = await this.getFromIDB<T>(keyStr, store);
		if (idbData) return idbData;

		// 3. Try localStorage for small data
		if (store === "METADATA") {
			const lsData = localStorage.getItem(keyStr);
			if (lsData) {
				try {
					return JSON.parse(lsData);
				} catch {
					// Invalid JSON, skip
				}
			}
		}

		return null;
	}

	/**
	 * Set value in cache (both Query and persistent storage)
	 */
	async set<T>(
		key: CacheKey,
		value: T,
		ttl: CacheTime = 1000 * 60 * 10,
		store: keyof typeof STORAGE_CONFIG.STORES = "METADATA",
	): Promise<void> {
		const keyStr = this.stringifyKey(key);
		const queryKey = Array.isArray(key) ? key : [key];

		// Set in Query cache
		queryClient.setQueryData(queryKey, value);

		// Set in IndexedDB
		if (!this.db) await this.init();
		await this.setToIDB(keyStr, value, store);

		// Set in localStorage for small data
		if (store === "METADATA" && typeof value === "object") {
			try {
				localStorage.setItem(keyStr, JSON.stringify(value));
			} catch (e) {
				// Storage full, silently fail
			}
		}
	}

	/**
	 * Invalidate cache entries by pattern
	 */
	invalidate(pattern: string | RegExp): void {
		const patternRegex =
			typeof pattern === "string" ? new RegExp(pattern) : pattern;

		queryClient
			.getQueryCache()
			.getAll()
			.forEach((query) => {
				const key = String(query.queryKey[0]);
				if (patternRegex.test(key)) {
					queryClient.invalidateQueries({ queryKey: [key] as any });
				}
			});
	}

	/**
	 * Clear all cached data
	 */
	async clear(
		store: keyof typeof STORAGE_CONFIG.STORES = "METADATA",
	): Promise<void> {
		// Clear Query cache
		queryClient.clear();

		// Clear IndexedDB store
		if (!this.db) await this.init();
		await this.clearIDB(store);

		// Clear localStorage
		for (const key of Object.values(STORAGE_CONFIG.STORES)) {
			localStorage.removeItem(key);
		}
	}

	/**
	 * Get Query client instance
	 */
	getQueryClient(): QueryClient {
		return queryClient;
	}

	/**
	 * Private: Get from IndexedDB
	 */
	private async getFromIDB<T>(
		key: string,
		store: keyof typeof STORAGE_CONFIG.STORES,
	): Promise<T | null> {
		if (!this.db) return null;

		return new Promise((resolve) => {
			try {
				const tx = this.db!.transaction(
					STORAGE_CONFIG.STORES[store],
					"readonly",
				);
				const objectStore = tx.objectStore(STORAGE_CONFIG.STORES[store]);
				const request = objectStore.get(key);

				request.onsuccess = () => resolve(request.result || null);
				request.onerror = () => resolve(null);
			} catch {
				resolve(null);
			}
		});
	}

	/**
	 * Private: Set to IndexedDB
	 */
	private async setToIDB<T>(
		key: string,
		value: T,
		store: keyof typeof STORAGE_CONFIG.STORES,
	): Promise<void> {
		if (!this.db) return;

		return new Promise((resolve) => {
			try {
				const tx = this.db!.transaction(
					STORAGE_CONFIG.STORES[store],
					"readwrite",
				);
				const objectStore = tx.objectStore(STORAGE_CONFIG.STORES[store]);
				objectStore.put(value, key);

				tx.oncomplete = () => resolve();
				tx.onerror = () => resolve();
			} catch {
				resolve();
			}
		});
	}

	/**
	 * Private: Clear IndexedDB store
	 */
	private async clearIDB(
		store: keyof typeof STORAGE_CONFIG.STORES,
	): Promise<void> {
		if (!this.db) return;

		return new Promise((resolve) => {
			try {
				const tx = this.db!.transaction(
					STORAGE_CONFIG.STORES[store],
					"readwrite",
				);
				const objectStore = tx.objectStore(STORAGE_CONFIG.STORES[store]);
				objectStore.clear();

				tx.oncomplete = () => resolve();
				tx.onerror = () => resolve();
			} catch {
				resolve();
			}
		});
	}

	/**
	 * Private: Convert cache key to string for storage
	 */
	private stringifyKey(key: CacheKey): string {
		if (typeof key === "string") return key;
		if (Array.isArray(key)) return key.join(":");
		return String(key);
	}
}

// Singleton instance
export const cacheManager = new CacheManager();
