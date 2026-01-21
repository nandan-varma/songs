import type { DetailedSong } from "@/types/entity";

export interface SavedQueue {
	songs: DetailedSong[];
	currentIndex: number;
	savedAt: number;
}

const QUEUE_STORAGE_KEY = "music-app-queue";
const QUEUE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function saveQueue(songs: DetailedSong[], currentIndex: number) {
	if (typeof window === "undefined") return;
	const data: SavedQueue = {
		songs,
		currentIndex,
		savedAt: Date.now(),
	};
	localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(data));
}

export function loadQueue(): SavedQueue | null {
	if (typeof window === "undefined") return null;

	const data = localStorage.getItem(QUEUE_STORAGE_KEY);
	if (!data) return null;

	try {
		const parsed = JSON.parse(data) as SavedQueue;
		const age = Date.now() - parsed.savedAt;
		if (age > QUEUE_MAX_AGE) {
			clearQueue();
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}

export function clearQueue() {
	if (typeof window === "undefined") return;
	localStorage.removeItem(QUEUE_STORAGE_KEY);
}
