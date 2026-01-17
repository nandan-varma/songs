import type { DetailedSong } from "@/lib/types";
import type { IDBConnection } from "./connection";

export interface CachedSong {
	id: string;
	metadata: DetailedSong;
	audioBlob?: Blob;
	images: { [quality: string]: Blob };
	cachedAt: number;
	lastAccessed: number;
}

/**
 * Handles song metadata operations
 * Single responsibility: Song CRUD operations
 */
export class SongOperations {
	constructor(private connection: IDBConnection) {}

	private get stores() {
		return this.connection.getStoreNames();
	}

	async saveSong(song: DetailedSong): Promise<void> {
		const db = await this.connection.open();
		const tx = db.transaction([this.stores.SONGS], "readwrite");
		const store = tx.objectStore(this.stores.SONGS);

		const cachedSong: CachedSong = {
			id: song.id,
			metadata: song,
			images: {},
			cachedAt: Date.now(),
			lastAccessed: Date.now(),
		};

		return new Promise<void>((resolve, reject) => {
			const request = store.put(cachedSong);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async getSong(songId: string): Promise<CachedSong | null> {
		const db = await this.connection.open();
		const tx = db.transaction([this.stores.SONGS], "readonly");
		const store = tx.objectStore(this.stores.SONGS);

		return new Promise((resolve, reject) => {
			const request = store.get(songId);
			request.onsuccess = () => {
				const song = request.result as CachedSong | undefined;
				if (song) {
					// Update last accessed time without blocking
					this.updateLastAccessed(songId).catch(() => {
						// Silent error - non-critical path
					});
				}
				resolve(song || null);
			};
			request.onerror = () => reject(request.error);
		});
	}

	async getAllSongs(): Promise<CachedSong[]> {
		const db = await this.connection.open();
		const tx = db.transaction([this.stores.SONGS], "readonly");
		const store = tx.objectStore(this.stores.SONGS);

		return new Promise((resolve, reject) => {
			const request = store.getAll();
			request.onsuccess = () => resolve(request.result as CachedSong[]);
			request.onerror = () => reject(request.error);
		});
	}

	async deleteSong(songId: string): Promise<void> {
		const db = await this.connection.open();
		const tx = db.transaction([this.stores.SONGS], "readwrite");
		const store = tx.objectStore(this.stores.SONGS);

		return new Promise<void>((resolve, reject) => {
			const request = store.delete(songId);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async updateLastAccessed(songId: string): Promise<void> {
		const db = await this.connection.open();
		const tx = db.transaction([this.stores.SONGS], "readwrite");
		const store = tx.objectStore(this.stores.SONGS);

		const song = await new Promise<CachedSong | null>((resolve, reject) => {
			const request = store.get(songId);
			request.onsuccess = () =>
				resolve((request.result as CachedSong | undefined) || null);
			request.onerror = () => reject(request.error);
		});

		if (song) {
			song.lastAccessed = Date.now();
			return new Promise<void>((resolve, reject) => {
				const request = store.put(song);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		}
	}

	async clear(): Promise<void> {
		const db = await this.connection.open();
		const tx = db.transaction([this.stores.SONGS], "readwrite");
		const store = tx.objectStore(this.stores.SONGS);

		return new Promise<void>((resolve, reject) => {
			const request = store.clear();
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}
}

/**
 * Handles audio blob operations
 * Single responsibility: Audio blob CRUD operations
 */
export class AudioOperations {
	constructor(private connection: IDBConnection) {}

	private get stores() {
		return this.connection.getStoreNames();
	}

	async saveAudioBlob(songId: string, blob: Blob): Promise<void> {
		const db = await this.connection.open();
		const tx = db.transaction([this.stores.AUDIO], "readwrite");
		const store = tx.objectStore(this.stores.AUDIO);

		return new Promise<void>((resolve, reject) => {
			const request = store.put({ songId, blob });
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async getAudioBlob(songId: string): Promise<Blob | null> {
		const db = await this.connection.open();
		const tx = db.transaction([this.stores.AUDIO], "readonly");
		const store = tx.objectStore(this.stores.AUDIO);

		return new Promise((resolve, reject) => {
			const request = store.get(songId);
			request.onsuccess = () => {
				const result = request.result as
					| { songId: string; blob: Blob }
					| undefined;
				resolve(result?.blob || null);
			};
			request.onerror = () => reject(request.error);
		});
	}

	async deleteAudioBlob(songId: string): Promise<void> {
		const db = await this.connection.open();
		const tx = db.transaction([this.stores.AUDIO], "readwrite");
		const store = tx.objectStore(this.stores.AUDIO);

		return new Promise<void>((resolve, reject) => {
			const request = store.delete(songId);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async clear(): Promise<void> {
		const db = await this.connection.open();
		const tx = db.transaction([this.stores.AUDIO], "readwrite");
		const store = tx.objectStore(this.stores.AUDIO);

		return new Promise<void>((resolve, reject) => {
			const request = store.clear();
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}
}

/**
 * Handles image blob operations
 * Single responsibility: Image blob CRUD operations
 */
export class ImageOperations {
	constructor(private connection: IDBConnection) {}

	private get stores() {
		return this.connection.getStoreNames();
	}

	async saveImageBlob(
		key: string,
		blob: Blob,
		metadata?: { songId: string; quality: string },
	): Promise<void> {
		const db = await this.connection.open();
		const tx = db.transaction([this.stores.IMAGES], "readwrite");
		const store = tx.objectStore(this.stores.IMAGES);

		return new Promise<void>((resolve, reject) => {
			const request = store.put({ key, blob, metadata });
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async getImageBlob(key: string): Promise<Blob | null> {
		const db = await this.connection.open();
		const tx = db.transaction([this.stores.IMAGES], "readonly");
		const store = tx.objectStore(this.stores.IMAGES);

		return new Promise((resolve, reject) => {
			const request = store.get(key);
			request.onsuccess = () => {
				const result = request.result as
					| { key: string; blob: Blob }
					| undefined;
				resolve(result?.blob || null);
			};
			request.onerror = () => reject(request.error);
		});
	}

	async deleteImageBlob(key: string): Promise<void> {
		const db = await this.connection.open();
		const tx = db.transaction([this.stores.IMAGES], "readwrite");
		const store = tx.objectStore(this.stores.IMAGES);

		return new Promise<void>((resolve, reject) => {
			const request = store.delete(key);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async clear(): Promise<void> {
		const db = await this.connection.open();
		const tx = db.transaction([this.stores.IMAGES], "readwrite");
		const store = tx.objectStore(this.stores.IMAGES);

		return new Promise<void>((resolve, reject) => {
			const request = store.clear();
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}
}

/**
 * Handles storage estimation
 * Single responsibility: Storage quota queries
 */
export class StorageOperations {
	async getStorageSize(): Promise<number> {
		if (
			typeof navigator !== "undefined" &&
			"storage" in navigator &&
			"estimate" in navigator.storage
		) {
			const estimate = await navigator.storage.estimate();
			return estimate.usage || 0;
		}
		return 0;
	}

	async getStorageQuota(): Promise<{ usage: number; quota: number }> {
		if (
			typeof navigator !== "undefined" &&
			"storage" in navigator &&
			"estimate" in navigator.storage
		) {
			const estimate = await navigator.storage.estimate();
			return {
				usage: estimate.usage || 0,
				quota: estimate.quota || 0,
			};
		}
		return { usage: 0, quota: 0 };
	}
}
