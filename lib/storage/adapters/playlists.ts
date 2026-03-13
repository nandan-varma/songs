/**
 * Playlists storage adapter
 * Handles local playlists using IndexedDB
 */

import type { LocalPlaylist } from "@/types/entity";

const DB_NAME = "music-app-playlists";
const STORE_NAME = "playlists";
const DB_VERSION = 3;

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
				db.createObjectStore(STORE_NAME, { keyPath: "id" });
			}
		};
	});
}

export const playlistsStorage = {
	async getAll(): Promise<LocalPlaylist[]> {
		try {
			const db = await getDB();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(STORE_NAME, "readonly");
				const store = transaction.objectStore(STORE_NAME);
				const request = store.getAll();

				request.onsuccess = () => resolve(request.result as LocalPlaylist[]);
				request.onerror = () => reject(request.error);
			});
		} catch {
			return [];
		}
	},

	async get(id: string): Promise<LocalPlaylist | null> {
		try {
			const db = await getDB();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(STORE_NAME, "readonly");
				const store = transaction.objectStore(STORE_NAME);
				const request = store.get(id);

				request.onsuccess = () =>
					resolve(request.result as LocalPlaylist | null);
				request.onerror = () => reject(request.error);
			});
		} catch {
			return null;
		}
	},

	async save(playlist: LocalPlaylist): Promise<void> {
		try {
			const db = await getDB();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(STORE_NAME, "readwrite");
				const store = transaction.objectStore(STORE_NAME);
				store.put(playlist);

				transaction.oncomplete = () => resolve();
				transaction.onerror = () => reject(transaction.error);
			});
		} catch {
			// Silently fail
		}
	},

	async delete(id: string): Promise<void> {
		try {
			const db = await getDB();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(STORE_NAME, "readwrite");
				const store = transaction.objectStore(STORE_NAME);
				store.delete(id);

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
