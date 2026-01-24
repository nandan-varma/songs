import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
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

const MAX_HISTORY_ITEMS = 10;

interface HistoryStore {
	history: HistoryItem[];

	// Actions
	addToHistory: (item: HistoryItem) => void;
	clearHistory: () => void;
	removeFromHistory: (id: string) => void;
}

export const useHistoryStore = create<HistoryStore>()(
	devtools(
		persist(
			(set) => ({
				history: [],

				addToHistory: (item) => {
					set((state) => {
						try {
							// Remove existing item with same id if present
							const filtered = state.history.filter((h) => h.id !== item.id);
							// Add new item at the beginning
							const newHistory = [item, ...filtered];
							// Keep only the last MAX_HISTORY_ITEMS
							return { history: newHistory.slice(0, MAX_HISTORY_ITEMS) };
						} catch (error) {
							logError("HistoryStore.addToHistory", error);
							return state;
						}
					});
				},

				clearHistory: () => {
					set({ history: [] });
				},

				removeFromHistory: (id) => {
					set((state) => ({
						history: state.history.filter((item) => item.id !== id),
					}));
				},
			}),
			{
				name: "music-app-history",
			},
		),
		{ name: "history-store" },
	),
);
