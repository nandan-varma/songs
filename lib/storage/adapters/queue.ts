/**
 * Queue storage adapter
 * Handles queue persistence using localStorage
 */

import type { DetailedSong } from "@/types/entity";

const QUEUE_KEY = "music-app-queue";
const QUEUE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

interface SavedQueue {
	songs: DetailedSong[];
	currentIndex: number;
	savedAt: number;
}

function getStorage(): Storage | null {
	if (typeof window === "undefined") return null;
	return window.localStorage;
}

export const queueStorage = {
	save(songs: DetailedSong[], currentIndex: number): void {
		const storage = getStorage();
		if (!storage) return;

		const data: SavedQueue = {
			songs,
			currentIndex,
			savedAt: Date.now(),
		};
		storage.setItem(QUEUE_KEY, JSON.stringify(data));
	},

	load(): SavedQueue | null {
		const storage = getStorage();
		if (!storage) return null;

		const data = storage.getItem(QUEUE_KEY);
		if (!data) return null;

		try {
			const parsed = JSON.parse(data) as SavedQueue;
			const age = Date.now() - parsed.savedAt;
			if (age > QUEUE_MAX_AGE) {
				this.clear();
				return null;
			}
			return parsed;
		} catch {
			return null;
		}
	},

	clear(): void {
		const storage = getStorage();
		if (!storage) return;
		storage.removeItem(QUEUE_KEY);
	},

	hasValid(): boolean {
		return this.load() !== null;
	},
};
