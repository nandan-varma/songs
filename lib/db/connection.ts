const DB_NAME = "MusicAppDB";
const DB_VERSION = 1;
const STORE_SONGS = "songs";
const STORE_AUDIO = "audio";
const STORE_IMAGES = "images";

/**
 * Manages IndexedDB connection initialization and schema
 * Single responsibility: Database connection lifecycle
 */
export class IDBConnection {
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

	getStoreNames() {
		return {
			SONGS: STORE_SONGS,
			AUDIO: STORE_AUDIO,
			IMAGES: STORE_IMAGES,
		};
	}
}
