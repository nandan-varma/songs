import type { DetailedSong } from "@/lib/types";

const DB_NAME = "MusicAppDB";
const DB_VERSION = 1;
const STORE_SONGS = "songs";
const STORE_AUDIO = "audio";
const STORE_IMAGES = "images";

export interface CachedSong {
	id: string;
	metadata: DetailedSong;
	audioBlob?: Blob;
	images: { [quality: string]: Blob };
	cachedAt: number;
	lastAccessed: number;
}

class MusicDatabase {
	private db: IDBDatabase | null = null;
	private dbPromise: Promise<IDBDatabase> | null = null;

	async open(): Promise<IDBDatabase> {
		if (this.db) return this.db;
		if (this.dbPromise) return this.dbPromise;

		this.dbPromise = new Promise((resolve, reject) => {
			if (typeof window === "undefined") {
				reject(new Error("IndexedDB is not available"));
				return;
			}

			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				this.db = request.result;
				resolve(request.result);
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Songs metadata store
				if (!db.objectStoreNames.contains(STORE_SONGS)) {
					const songsStore = db.createObjectStore(STORE_SONGS, {
						keyPath: "id",
					});
					songsStore.createIndex("cachedAt", "cachedAt", { unique: false });
					songsStore.createIndex("lastAccessed", "lastAccessed", {
						unique: false,
					});
				}

				// Audio blobs store
				if (!db.objectStoreNames.contains(STORE_AUDIO)) {
					db.createObjectStore(STORE_AUDIO, { keyPath: "songId" });
				}

				// Images blobs store
				if (!db.objectStoreNames.contains(STORE_IMAGES)) {
					db.createObjectStore(STORE_IMAGES, { keyPath: "key" });
				}
			};
		});

		return this.dbPromise;
	}

	async saveSong(song: DetailedSong): Promise<void> {
		const db = await this.open();
		const tx = db.transaction([STORE_SONGS], "readwrite");
		const store = tx.objectStore(STORE_SONGS);

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
		const db = await this.open();
		const tx = db.transaction([STORE_AUDIO], "readwrite");
		const store = tx.objectStore(STORE_AUDIO);

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
		const db = await this.open();
		const tx = db.transaction([STORE_IMAGES], "readwrite");
		const store = tx.objectStore(STORE_IMAGES);

		await new Promise<void>((resolve, reject) => {
			const request = store.put({ key, blob, metadata });
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async getSong(songId: string): Promise<CachedSong | null> {
		const db = await this.open();
		const tx = db.transaction([STORE_SONGS], "readonly");
		const store = tx.objectStore(STORE_SONGS);

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
		const db = await this.open();
		const tx = db.transaction([STORE_AUDIO], "readonly");
		const store = tx.objectStore(STORE_AUDIO);

		return new Promise((resolve, reject) => {
			const request = store.get(songId);
			request.onsuccess = () => {
				const result = request.result as { songId: string; blob: Blob } | undefined;
				resolve(result?.blob || null);
			};
			request.onerror = () => reject(request.error);
		});
	}

	async getImageBlob(key: string): Promise<Blob | null> {
		const db = await this.open();
		const tx = db.transaction([STORE_IMAGES], "readonly");
		const store = tx.objectStore(STORE_IMAGES);

		return new Promise((resolve, reject) => {
			const request = store.get(key);
			request.onsuccess = () => {
				const result = request.result as { key: string; blob: Blob } | undefined;
				resolve(result?.blob || null);
			};
			request.onerror = () => reject(request.error);
		});
	}

	async getAllSongs(): Promise<CachedSong[]> {
		const db = await this.open();
		const tx = db.transaction([STORE_SONGS], "readonly");
		const store = tx.objectStore(STORE_SONGS);

		return new Promise((resolve, reject) => {
			const request = store.getAll();
			request.onsuccess = () => resolve(request.result as CachedSong[]);
			request.onerror = () => reject(request.error);
		});
	}

	async deleteSong(songId: string): Promise<void> {
		const db = await this.open();
		const tx = db.transaction([STORE_SONGS, STORE_AUDIO], "readwrite");
		const songsStore = tx.objectStore(STORE_SONGS);
		const audioStore = tx.objectStore(STORE_AUDIO);

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
		const db = await this.open();
		const tx = db.transaction([STORE_SONGS], "readwrite");
		const store = tx.objectStore(STORE_SONGS);

		const song = await new Promise<CachedSong | null>((resolve, reject) => {
			const request = store.get(songId);
			request.onsuccess = () => resolve(request.result as CachedSong | undefined || null);
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
		const db = await this.open();
		const tx = db.transaction([STORE_SONGS, STORE_AUDIO, STORE_IMAGES], "readwrite");

		await Promise.all([
			new Promise<void>((resolve, reject) => {
				const request = tx.objectStore(STORE_SONGS).clear();
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			}),
			new Promise<void>((resolve, reject) => {
				const request = tx.objectStore(STORE_AUDIO).clear();
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			}),
			new Promise<void>((resolve, reject) => {
				const request = tx.objectStore(STORE_IMAGES).clear();
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			}),
		]);
	}

	async getStorageSize(): Promise<number> {
		if (typeof navigator !== "undefined" && "storage" in navigator && "estimate" in navigator.storage) {
			const estimate = await navigator.storage.estimate();
			return estimate.usage || 0;
		}
		return 0;
	}
}

export const musicDB = new MusicDatabase();
