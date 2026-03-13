/**
 * Search history storage adapter
 * Handles search history using localStorage
 */

const SEARCH_KEY = "music-app-search-history";
const MAX_ITEMS = 10;

interface SearchItem {
	query: string;
	timestamp: number;
}

function getStorage(): Storage | null {
	if (typeof window === "undefined") return null;
	return window.localStorage;
}

function parseItems(data: string | null): SearchItem[] {
	if (!data) return [];
	try {
		return JSON.parse(data);
	} catch {
		return [];
	}
}

export const searchHistoryStorage = {
	getAll(): SearchItem[] {
		const storage = getStorage();
		if (!storage) return [];
		return parseItems(storage.getItem(SEARCH_KEY));
	},

	add(query: string): SearchItem[] {
		const storage = getStorage();
		if (!storage) return [];

		const items = this.getAll();
		const filtered = items.filter((item) => item.query !== query);
		const updated = [{ query, timestamp: Date.now() }, ...filtered].slice(
			0,
			MAX_ITEMS,
		);
		storage.setItem(SEARCH_KEY, JSON.stringify(updated));
		return updated;
	},

	remove(query: string): SearchItem[] {
		const storage = getStorage();
		if (!storage) return [];

		const items = this.getAll();
		const filtered = items.filter((item) => item.query !== query);
		storage.setItem(SEARCH_KEY, JSON.stringify(filtered));
		return filtered;
	},

	clear(): void {
		const storage = getStorage();
		if (!storage) return;
		storage.removeItem(SEARCH_KEY);
	},

	getQueries(): string[] {
		return this.getAll().map((item) => item.query);
	},
};
