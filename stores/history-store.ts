import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { logError } from "@/lib/utils/logger";
import type {
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
	DetailedSong,
	EntityType,
} from "@/types/entity";

export type HistoryItem =
	| { id: string; type: EntityType.SONG; data: DetailedSong; timestamp: Date }
	| { id: string; type: EntityType.ALBUM; data: DetailedAlbum; timestamp: Date }
	| {
			id: string;
			type: EntityType.ARTIST;
			data: DetailedArtist;
			timestamp: Date;
	  }
	| {
			id: string;
			type: EntityType.PLAYLIST;
			data: DetailedPlaylist;
			timestamp: Date;
	  };

interface HistoryStore {
	history: HistoryItem[];
	addToHistory: {
		(item: {
			id: string;
			type: EntityType.SONG;
			data: DetailedSong;
			timestamp: Date;
		}): void;
		(item: {
			id: string;
			type: EntityType.ALBUM;
			data: DetailedAlbum;
			timestamp: Date;
		}): void;
		(item: {
			id: string;
			type: EntityType.ARTIST;
			data: DetailedArtist;
			timestamp: Date;
		}): void;
		(item: {
			id: string;
			type: EntityType.PLAYLIST;
			data: DetailedPlaylist;
			timestamp: Date;
		}): void;
	};
	clearHistory: () => void;
	removeFromHistory: (id: string) => void;
}

const HISTORY_STORAGE_KEY = "music-app-history";
const MAX_HISTORY_ITEMS = 10;

export const useHistoryStore = create<HistoryStore>()(
	persist(
		(set, get) => ({
			history: [],

			addToHistory: (item: HistoryItem) => {
				set((state) => {
					// Remove existing item with same id if present
					const filtered = state.history.filter((h) => h.id !== item.id);
					// Add new item at the beginning
					const newHistory = [item, ...filtered];
					// Keep only the last MAX_HISTORY_ITEMS
					return { history: newHistory.slice(0, MAX_HISTORY_ITEMS) };
				});
			},

			clearHistory: () => {
				set({ history: [] });
			},

			removeFromHistory: (id: string) => {
				set((state) => ({
					history: state.history.filter((item) => item.id !== id),
				}));
			},
		}),
		{
			name: HISTORY_STORAGE_KEY,
			storage: createJSONStorage(() => localStorage, {
				reviver: (key, value) => {
					// Convert timestamp strings back to Date objects
					if (key === "timestamp" && typeof value === "string") {
						return new Date(value);
					}
					return value;
				},
				replacer: (_key, value) => {
					// Convert Date objects to ISO strings for storage
					if (value instanceof Date) {
						return value.toISOString();
					}
					return value;
				},
			}),
			onRehydrateStorage: () => (state) => {
				if (!state) {
					logError(
						"HistoryStore:rehydrate",
						new Error("Failed to rehydrate history"),
					);
				}
			},
		},
	),
);

// Selector hooks
export const useHistory = () =>
	useHistoryStore((state) => ({
		history: state.history,
		addToHistory: state.addToHistory,
		clearHistory: state.clearHistory,
		removeFromHistory: state.removeFromHistory,
	}));
