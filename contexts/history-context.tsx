"use client";

import { createContext, useContext } from "react";
import { useHistoryStore } from "@/stores/history-store";
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

interface HistoryContextType {
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

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
	const store = useHistoryStore();

	const value: HistoryContextType = {
		history: store.history,
		addToHistory: store.addToHistory,
		clearHistory: store.clearHistory,
		removeFromHistory: store.removeFromHistory,
	};

	return (
		<HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
	);
}

export function useHistory() {
	const context = useContext(HistoryContext);
	if (context === undefined) {
		throw new Error("useHistory must be used within a HistoryProvider");
	}
	return context;
}
