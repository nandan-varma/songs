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
 * Handles CRUD operations for IndexedDB stores
 * Single responsibility: Database operations
 */
export class IDBOperations {
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

		await new Promise<void>((resolve, reject) => {
			const request = store.put(cachedSong);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async saveAudioBlob(songId: string, blob: Blob): Promise<void> {
		const db = await this.connection.open();
		const tx = db.transaction([this.stores.AUDIO], "readwrite");
		const store = tx.objectStore(this.stores.AUDIO);

		await new Promise<void>((resolve, reject) => {
			const request = store.put({ songId, blob });
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async saveImageBlob(
		key: string,
		blob: Blob,
		metadata?: { songId: string; quality: string },
	): Promise<void> {
		const db = await this.connection.open();
		const tx = db.transaction([this.stores.IMAGES], "readwrite");
		const store = tx.objectStore(this.stores.IMAGES);

		await new Promise<void>((resolve, reject) => {
			const request = store.put({ key, blob, metadata });
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
					// Update last accessed time
					this.updateLastAccessed(songId).catch(console.error);
				}
				resolve(song || null);
			};
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
		const tx = db.transaction(
			[this.stores.SONGS, this.stores.AUDIO],
			"readwrite",
		);
		const songsStore = tx.objectStore(this.stores.SONGS);
		const audioStore = tx.objectStore(this.stores.AUDIO);

		await Promise.all([
			new Promise<void>((resolve, reject) => {
				const request = songsStore.delete(songId);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			}),
			new Promise<void>((resolve, reject) => {
				const request = audioStore.delete(songId);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			}),
		]);
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
			await new Promise<void>((resolve, reject) => {
				const request = store.put(song);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		}
	}

	async clearAll(): Promise<void> {
		const db = await this.connection.open();
		const tx = db.transaction(
			[this.stores.SONGS, this.stores.AUDIO, this.stores.IMAGES],
			"readwrite",
		);

		await Promise.all([
			new Promise<void>((resolve, reject) => {
				const request = tx.objectStore(this.stores.SONGS).clear();
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			}),
			new Promise<void>((resolve, reject) => {
				const request = tx.objectStore(this.stores.AUDIO).clear();
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			}),
			new Promise<void>((resolve, reject) => {
				const request = tx.objectStore(this.stores.IMAGES).clear();
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			}),
		]);
	}

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
}
