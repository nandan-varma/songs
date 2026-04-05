import type { DetailedSong } from "@/types/entity";
import { DEFAULT_VOLUME } from "@/types/player";
import type { AppStore, AppStoreState } from "./types";

export type StoreSet = (
	partial: Partial<AppStore> | ((state: AppStore) => Partial<AppStore>),
) => void;

export type StoreGet = () => AppStore;

export const INITIAL_STATE: AppStoreState = {
	currentSong: null,
	isPlaying: false,
	currentTime: 0,
	duration: 0,
	volume: DEFAULT_VOLUME,
	playbackSpeed: 1,
	isMuted: false,
	queue: [],
	queueIndex: 0,
	isShuffleEnabled: false,
	repeatMode: "off",
	favoriteIds: new Set(),
	searchHistory: [],
	playbackHistory: [],
	visitHistory: [],
	maxHistorySize: 100,
	playlists: [],
	isQueueOpen: false,
	downloadedSongIds: new Set(),
	sleepTimerMinutes: null,
};

export function clampVolume(volume: number) {
	return Math.max(0, Math.min(1, volume));
}

export function clampPlaybackSpeed(speed: number) {
	return Math.max(0.25, Math.min(2, speed));
}

export function createPlaylistId() {
	return `playlist_${crypto.randomUUID()}`;
}

export function dedupeStrings(
	items: string[],
	nextItem: string,
	maxSize: number,
) {
	return [nextItem, ...items.filter((item) => item !== nextItem)].slice(
		0,
		maxSize,
	);
}

export function dedupeById<T extends { id: string }>(
	items: T[],
	nextItem: T,
	maxSize: number,
) {
	return [nextItem, ...items.filter((item) => item.id !== nextItem.id)].slice(
		0,
		maxSize,
	);
}

export function dedupeByEntity<T extends { entityId: string }>(
	items: T[],
	nextItem: T,
	maxSize: number,
) {
	return [
		nextItem,
		...items.filter((item) => item.entityId !== nextItem.entityId),
	].slice(0, maxSize);
}

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
	const nextItems = [...items];
	const [movedItem] = nextItems.splice(fromIndex, 1);
	if (movedItem === undefined) {
		return items;
	}

	nextItems.splice(toIndex, 0, movedItem);
	return nextItems;
}

export function shuffleQueue(queue: DetailedSong[], currentIndex: number) {
	if (queue.length <= 1) {
		return { queue, queueIndex: currentIndex };
	}

	const currentSong = queue[currentIndex] ?? queue[0] ?? null;
	const remainingSongs = queue.filter((_, index) => index !== currentIndex);

	for (let index = remainingSongs.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		const temp = remainingSongs[index];
		remainingSongs[index] = remainingSongs[swapIndex] as DetailedSong;
		remainingSongs[swapIndex] = temp as DetailedSong;
	}

	if (!currentSong) {
		return { queue: remainingSongs, queueIndex: 0 };
	}

	return {
		queue: [currentSong, ...remainingSongs],
		queueIndex: 0,
	};
}
