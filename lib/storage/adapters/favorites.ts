/**
 * Favorites storage adapter
 * Handles user favorites using IndexedDB
 */

import type { DetailedSong } from "@/types/entity";

const DB_NAME = "MusicAppFavoritesDB";
const STORE_NAME = "favorites";
const DB_VERSION = 1;

interface FavoriteEntry {
	songId: string;
	song: DetailedSong;
	addedAt: number;
}

function getDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		if (typeof window === "undefined") {
			reject(new Error("IndexedDB not available"));
			return;
		}

		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: "songId" });
			}
		};
	});
}

export const favoritesStorage = {
	async getAll(): Promise<DetailedSong[]> {
		try {
			const db = await getDB();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(STORE_NAME, "readonly");
				const store = transaction.objectStore(STORE_NAME);
				const request = store.getAll();

				request.onsuccess = () => {
					const entries = request.result as FavoriteEntry[];
					resolve(entries.map((e) => e.song));
				};
				request.onerror = () => reject(request.error);
			});
		} catch {
			return [];
		}
	},

	async isFavorite(songId: string): Promise<boolean> {
		try {
			const db = await getDB();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(STORE_NAME, "readonly");
				const store = transaction.objectStore(STORE_NAME);
				const request = store.get(songId);

				request.onsuccess = () => resolve(!!request.result);
				request.onerror = () => reject(request.error);
			});
		} catch {
			return false;
		}
	},

	async add(song: DetailedSong): Promise<void> {
		try {
			const db = await getDB();
			const entry: FavoriteEntry = {
				songId: song.id,
				song,
				addedAt: Date.now(),
			};

			return new Promise((resolve, reject) => {
				const transaction = db.transaction(STORE_NAME, "readwrite");
				const store = transaction.objectStore(STORE_NAME);
				store.put(entry);

				transaction.oncomplete = () => resolve();
				transaction.onerror = () => reject(transaction.error);
			});
		} catch {
			// Silently fail
		}
	},

	async remove(songId: string): Promise<void> {
		try {
			const db = await getDB();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(STORE_NAME, "readwrite");
				const store = transaction.objectStore(STORE_NAME);
				store.delete(songId);

				transaction.oncomplete = () => resolve();
				transaction.onerror = () => reject(transaction.error);
			});
		} catch {
			// Silently fail
		}
	},

	async clear(): Promise<void> {
		try {
			const db = await getDB();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(STORE_NAME, "readwrite");
				const store = transaction.objectStore(STORE_NAME);
				store.clear();

				transaction.oncomplete = () => resolve();
				transaction.onerror = () => reject(transaction.error);
			});
		} catch {
			// Silently fail
		}
	},
};
