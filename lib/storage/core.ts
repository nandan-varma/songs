/**
 * Unified Storage Manager
 * Central interface for all storage operations (localStorage, IndexedDB, remote API)
 */

import {
	type ExportData,
	INDEXED_DB,
	type IndexedDBName,
	isBrowser,
	type JsonValue,
	LOCAL_STORAGE_KEYS,
	type LocalStorageKey,
	type Migration,
	type RemoteAPIConfig,
	STORAGE_PREFIX,
	STORAGE_VERSION,
	STORAGE_VERSION_KEY,
	type StorageBackendConfig,
} from "./config";

class StorageManager {
	private initialized = false;
	private backends: Map<string, StorageBackendConfig> = new Map();
	private migrations: Migration[] = [];

	// ========================================================================
	// INITIALIZATION
	// ========================================================================

	/**
	 * Initialize storage system, run migrations if needed
	 */
	async initialize(): Promise<void> {
		if (this.initialized || !isBrowser()) return;

		await this.runMigrations();
		this.initialized = true;
	}

	private async runMigrations(): Promise<void> {
		const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);

		if (storedVersion !== STORAGE_VERSION) {
			for (const migration of this.migrations) {
				if (
					this.versionCompare(
						storedVersion || "0.0.0",
						migration.fromVersion,
					) <= 0
				) {
					continue;
				}
				if (this.versionCompare(migration.toVersion, STORAGE_VERSION) > 0) {
					continue;
				}

				console.log(
					`Migrating storage from ${migration.fromVersion} to ${migration.toVersion}`,
				);
			}

			localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
		}
	}

	private versionCompare(v1: string, v2: string): number {
		const a = v1.split(".").map(Number);
		const b = v2.split(".").map(Number);
		for (let i = 0; i < Math.max(a.length, b.length); i++) {
			const ai = a[i] ?? 0;
			const bi = b[i] ?? 0;
			if (ai !== bi) return ai - bi;
		}
		return 0;
	}

	// ========================================================================
	// BACKEND REGISTRATION
	// ========================================================================

	/**
	 * Register a storage backend for a specific key/DB
	 */
	registerBackend(name: string, config: StorageBackendConfig): void {
		this.backends.set(name, config);
	}

	/**
	 * Get backend config for a key/DB
	 */
	getBackend(name: string): StorageBackendConfig | undefined {
		return this.backends.get(name);
	}

	// ========================================================================
	// LOCAL STORAGE OPERATIONS
	// ========================================================================

	/**
	 * Get value from localStorage
	 */
	localGet<T = JsonValue>(key: LocalStorageKey): T | null {
		if (!isBrowser()) return null;

		try {
			const value = localStorage.getItem(key);
			if (value === null) return null;
			return JSON.parse(value) as T;
		} catch {
			return null;
		}
	}

	/**
	 * Set value in localStorage
	 */
	localSet(key: LocalStorageKey, value: JsonValue): void {
		if (!isBrowser()) return;

		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch (error) {
			console.error(`Failed to set localStorage key "${key}":`, error);
		}
	}

	/**
	 * Remove value from localStorage
	 */
	localRemove(key: LocalStorageKey): void {
		if (!isBrowser()) return;

		try {
			localStorage.removeItem(key);
		} catch (error) {
			console.error(`Failed to remove localStorage key "${key}":`, error);
		}
	}

	/**
	 * Get value or default from localStorage
	 */
	localGetOrDefault<T>(
		key: LocalStorageKey,
		defaultValue: T,
		validator?: (data: unknown) => T | null,
	): T {
		const value = this.localGet<unknown>(key);
		if (value === null) return defaultValue;
		if (validator) {
			const validated = validator(value);
			return validated !== null ? validated : defaultValue;
		}
		return value as T;
	}

	// ========================================================================
	// INDEXED DB OPERATIONS
	// ========================================================================

	/**
	 * Open IndexedDB and get connection
	 */
	private async openDB(dbName: string, version: number): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(dbName, version);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);

			request.onupgradeneeded = () => {
				// Schema creation is handled separately
			};
		});
	}

	/**
	 * Get all items from an IndexedDB store
	 */
	async idbGetAll<T>(dbName: IndexedDBName, storeName: string): Promise<T[]> {
		if (!isBrowser()) return [];

		const dbConfig = INDEXED_DB[dbName];

		return new Promise((resolve, reject) => {
			this.openDB(dbConfig.NAME, dbConfig.VERSION)
				.then((db) => {
					const transaction = db.transaction(storeName, "readonly");
					const store = transaction.objectStore(storeName);
					const request = store.getAll();

					request.onsuccess = () => resolve(request.result as T[]);
					request.onerror = () => reject(request.error);
				})
				.catch(reject);
		});
	}

	/**
	 * Get single item from IndexedDB
	 */
	async idbGet<T>(
		dbName: IndexedDBName,
		storeName: string,
		key: string,
	): Promise<T | null> {
		if (!isBrowser()) return null;

		const dbConfig = INDEXED_DB[dbName];

		return new Promise((resolve, reject) => {
			this.openDB(dbConfig.NAME, dbConfig.VERSION)
				.then((db) => {
					const transaction = db.transaction(storeName, "readonly");
					const store = transaction.objectStore(storeName);
					const request = store.get(key);

					request.onsuccess = () => resolve(request.result as T | null);
					request.onerror = () => reject(request.error);
				})
				.catch(reject);
		});
	}

	/**
	 * Put item in IndexedDB
	 */
	async idbPut<T>(
		dbName: IndexedDBName,
		storeName: string,
		value: T,
	): Promise<void> {
		if (!isBrowser()) return;

		const dbConfig = INDEXED_DB[dbName];

		return new Promise((resolve, reject) => {
			this.openDB(dbConfig.NAME, dbConfig.VERSION)
				.then((db) => {
					const transaction = db.transaction(storeName, "readwrite");
					const store = transaction.objectStore(storeName);
					store.put(value);

					transaction.oncomplete = () => resolve();
					transaction.onerror = () => reject(transaction.error);
				})
				.catch(reject);
		});
	}

	/**
	 * Delete item from IndexedDB
	 */
	async idbDelete(
		dbName: IndexedDBName,
		storeName: string,
		key: string,
	): Promise<void> {
		if (!isBrowser()) return;

		const dbConfig = INDEXED_DB[dbName];

		return new Promise((resolve, reject) => {
			this.openDB(dbConfig.NAME, dbConfig.VERSION)
				.then((db) => {
					const transaction = db.transaction(storeName, "readwrite");
					const store = transaction.objectStore(storeName);
					store.delete(key);

					transaction.oncomplete = () => resolve();
					transaction.onerror = () => reject(transaction.error);
				})
				.catch(reject);
		});
	}

	/**
	 * Clear IndexedDB store
	 */
	async idbClear(dbName: IndexedDBName, storeName: string): Promise<void> {
		if (!isBrowser()) return;

		const dbConfig = INDEXED_DB[dbName];

		return new Promise((resolve, reject) => {
			this.openDB(dbConfig.NAME, dbConfig.VERSION)
				.then((db) => {
					const transaction = db.transaction(storeName, "readwrite");
					const store = transaction.objectStore(storeName);
					store.clear();

					transaction.oncomplete = () => resolve();
					transaction.onerror = () => reject(transaction.error);
				})
				.catch(reject);
		});
	}

	// ========================================================================
	// REMOTE API OPERATIONS (for future use)
	// ========================================================================

	/**
	 * Fetch from remote API
	 */
	private async remoteFetch<T>(
		endpoint: string,
		config: RemoteAPIConfig,
		options?: RequestInit,
	): Promise<T> {
		const response = await fetch(`${config.baseUrl}${endpoint}`, {
			...options,
			headers: {
				"Content-Type": "application/json",
				...config.headers,
				...options?.headers,
			},
		});

		if (!response.ok) {
			throw new Error(`API error: ${response.status}`);
		}

		return response.json();
	}

	/**
	 * Get from remote API
	 */
	async remoteGet<T>(backendName: string, endpoint: string): Promise<T> {
		const backend = this.backends.get(backendName);
		if (!backend || backend.type !== "remoteAPI" || !backend.remote) {
			throw new Error(`Remote backend "${backendName}" not configured`);
		}

		return this.remoteFetch<T>(endpoint, backend.remote);
	}

	/**
	 * Post to remote API
	 */
	async remotePost<T>(
		backendName: string,
		endpoint: string,
		data: unknown,
	): Promise<T> {
		const backend = this.backends.get(backendName);
		if (!backend || backend.type !== "remoteAPI" || !backend.remote) {
			throw new Error(`Remote backend "${backendName}" not configured`);
		}

		return this.remoteFetch<T>(endpoint, backend.remote, {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	// ========================================================================
	// CLEAR / BUST CACHE
	// ========================================================================

	/**
	 * Clear specific storage
	 */
	async clear(storage: string, store?: string): Promise<void> {
		const localKey = Object.values(LOCAL_STORAGE_KEYS).find(
			(k) => k === storage,
		);
		if (localKey) {
			this.localRemove(localKey);
			return;
		}

		const dbKey = storage as IndexedDBName;
		if (dbKey in INDEXED_DB) {
			if (store) {
				await this.idbClear(dbKey, store);
			} else {
				await this.deleteDatabase(dbKey);
			}
			return;
		}

		const legacyKey = `${STORAGE_PREFIX}-${storage}`;
		const legacyLocalKey = Object.values(LOCAL_STORAGE_KEYS).find(
			(k) => k === legacyKey,
		);
		if (legacyLocalKey) {
			this.localRemove(legacyLocalKey);
			return;
		}
	}

	/**
	 * Clear ALL storage (for cache busting)
	 */
	async clearAll(): Promise<void> {
		if (!isBrowser()) return;

		localStorage.clear();

		for (const dbKey of Object.keys(INDEXED_DB) as IndexedDBName[]) {
			await this.deleteDatabase(dbKey);
		}

		localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
	}

	/**
	 * Delete IndexedDB database
	 */
	private async deleteDatabase(dbName: IndexedDBName): Promise<void> {
		const dbConfig = INDEXED_DB[dbName];

		return new Promise((resolve, reject) => {
			const request = indexedDB.deleteDatabase(dbConfig.NAME);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
			request.onblocked = () => {
				resolve();
			};
		});
	}

	/**
	 * Force version bump (for cache busting)
	 */
	bumpVersion(): void {
		localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
	}

	// ========================================================================
	// EXPORT / IMPORT
	// ========================================================================

	/**
	 * Export all storage data for backup
	 */
	async exportData(): Promise<ExportData> {
		const localStorageData: Record<string, JsonValue> = {};

		for (const key of Object.values(LOCAL_STORAGE_KEYS)) {
			const value = this.localGet<JsonValue>(key);
			if (value !== null) {
				localStorageData[key] = value;
			}
		}

		const indexedDBData: Record<string, Record<string, JsonValue[]>> = {};

		for (const dbKey of Object.keys(INDEXED_DB) as IndexedDBName[]) {
			const dbConfig = INDEXED_DB[dbKey];
			indexedDBData[dbKey] = {};

			for (const storeKey of Object.values(dbConfig.STORES) as string[]) {
				const items = await this.idbGetAll<JsonValue>(dbKey, storeKey);
				indexedDBData[dbKey][storeKey] = items;
			}
		}

		return {
			version: STORAGE_VERSION,
			timestamp: Date.now(),
			localStorage: localStorageData,
			indexedDB: indexedDBData,
		};
	}

	/**
	 * Import storage data from backup
	 */
	async importData(data: ExportData): Promise<void> {
		for (const [key, value] of Object.entries(data.localStorage)) {
			this.localSet(key as LocalStorageKey, value);
		}

		for (const [dbKey, stores] of Object.entries(data.indexedDB)) {
			const dbName = dbKey as IndexedDBName;
			if (!(dbName in INDEXED_DB)) continue;

			for (const [storeName, items] of Object.entries(stores)) {
				for (const item of items) {
					await this.idbPut(dbName, storeName, item);
				}
			}
		}

		localStorage.setItem(STORAGE_VERSION_KEY, data.version);
	}

	// ========================================================================
	// MIGRATIONS
	// ========================================================================

	/**
	 * Add migration
	 */
	addMigration(migration: Migration): void {
		this.migrations.push(migration);
	}

	/**
	 * Run migrations manually
	 */
	async migrate(fromVersion: string): Promise<void> {
		let currentVersion = fromVersion;

		for (const migration of this.migrations) {
			if (this.versionCompare(currentVersion, migration.fromVersion) >= 0) {
				continue;
			}
			if (this.versionCompare(migration.toVersion, STORAGE_VERSION) > 0) {
				continue;
			}

			console.log(
				`Migrating storage from ${migration.fromVersion} to ${migration.toVersion}`,
			);

			currentVersion = migration.toVersion;
		}

		localStorage.setItem(STORAGE_VERSION_KEY, currentVersion);
	}
}

// ========================================================================
// SINGLETON EXPORT
// ========================================================================

export const storage = new StorageManager();

// Auto-initialize when imported in browser
if (isBrowser()) {
	storage.initialize().catch(console.error);
}
