import type { DetailedSong } from "@/types/entity";

export interface RecentlyPlayedItem {
	songId: string;
	title: string;
	artist: string;
	image?: string;
	album?: string;
	duration?: number;
	playedAt: string;
}

const RECENTLY_PLAYED_KEY = "music-app-recently-played";
const MAX_RECENT_ITEMS = 50;

export function getRecentlyPlayed(): RecentlyPlayedItem[] {
	if (typeof window === "undefined") return [];
	const data = localStorage.getItem(RECENTLY_PLAYED_KEY);
	if (!data) return [];
	try {
		return JSON.parse(data);
	} catch {
		return [];
	}
}

export function addToRecentlyPlayed(song: DetailedSong): RecentlyPlayedItem[] {
	if (typeof window === "undefined") return [];

	const items = getRecentlyPlayed();
	const newItem: RecentlyPlayedItem = {
		songId: song.id,
		title: song.name,
		artist: song.artists.primary.map((a) => a.name).join(", "),
		image: song.image?.[0]?.url ?? undefined,
		album: song.album?.name ?? undefined,
		duration: song.duration ?? undefined,
		playedAt: new Date().toISOString(),
	};

	const filtered = items.filter((item) => item.songId !== song.id);
	const updated = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);

	localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updated));
	return updated;
}

export function clearRecentlyPlayed() {
	if (typeof window === "undefined") return;
	localStorage.removeItem(RECENTLY_PLAYED_KEY);
}
