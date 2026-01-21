/**
 * History storage adapter
 * Handles browsing history using localStorage
 */

const HISTORY_KEY = "music-app-history";
const MAX_ITEMS = 100;

type HistoryType = "song" | "album" | "artist" | "playlist";

interface HistoryItem {
	id: string;
	type: HistoryType;
	data: unknown;
	timestamp: string;
}

function getStorage(): Storage | null {
	if (typeof window === "undefined") return null;
	return window.localStorage;
}

function parseItems(data: string | null): HistoryItem[] {
	if (!data) return [];
	try {
		return JSON.parse(data);
	} catch {
		return [];
	}
}

export const historyStorage = {
	getAll(): HistoryItem[] {
		const storage = getStorage();
		if (!storage) return [];
		return parseItems(storage.getItem(HISTORY_KEY));
	},

	add(item: Omit<HistoryItem, "timestamp">): HistoryItem[] {
		const storage = getStorage();
		if (!storage) return [];

		const items = this.getAll();
		const filtered = items.filter((i) => i.id !== item.id);
		const newItem: HistoryItem = {
			...item,
			timestamp: new Date().toISOString(),
		};
		const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
		storage.setItem(HISTORY_KEY, JSON.stringify(updated));
		return updated;
	},

	remove(id: string): HistoryItem[] {
		const storage = getStorage();
		if (!storage) return [];

		const items = this.getAll();
		const filtered = items.filter((item) => item.id !== id);
		storage.setItem(HISTORY_KEY, JSON.stringify(filtered));
		return filtered;
	},

	clear(): void {
		const storage = getStorage();
		if (!storage) return;
		storage.removeItem(HISTORY_KEY);
	},

	getByType(type: HistoryType): HistoryItem[] {
		return this.getAll().filter((item) => item.type === type);
	},
};
