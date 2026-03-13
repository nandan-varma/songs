/**
 * Recently played storage adapter
 * Handles recently played songs using localStorage
 */

import type { DetailedSong } from "@/types/entity";

const RECENT_KEY = "music-app-recently-played";
const MAX_ITEMS = 50;

interface RecentlyItem {
	songId: string;
	title: string;
	artist: string;
	image?: string;
	album?: string;
	duration?: number;
	playedAt: string;
}

function getStorage(): Storage | null {
	if (typeof window === "undefined") return null;
	return window.localStorage;
}

function parseItems(data: string | null): RecentlyItem[] {
	if (!data) return [];
	try {
		return JSON.parse(data);
	} catch {
		return [];
	}
}

export const recentlyPlayedStorage = {
	getAll(): RecentlyItem[] {
		const storage = getStorage();
		if (!storage) return [];
		return parseItems(storage.getItem(RECENT_KEY));
	},

	add(song: DetailedSong): RecentlyItem[] {
		const storage = getStorage();
		if (!storage) return [];

		const items = this.getAll();
		const newItem: RecentlyItem = {
			songId: song.id,
			title: song.name,
			artist: song.artists.primary.map((a) => a.name).join(", "),
			image: song.image?.[0]?.url || undefined,
			album: song.album?.name || undefined,
			duration: song.duration || undefined,
			playedAt: new Date().toISOString(),
		};

		const filtered = items.filter((item) => item.songId !== song.id);
		const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
		storage.setItem(RECENT_KEY, JSON.stringify(updated));
		return updated;
	},

	clear(): void {
		const storage = getStorage();
		if (!storage) return;
		storage.removeItem(RECENT_KEY);
	},

	getRecentItems(limit: number = 10): RecentlyItem[] {
		return this.getAll().slice(0, limit);
	},
};
