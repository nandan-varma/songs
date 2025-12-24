"use client";

import type {
	DetailedSong,
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
} from "@/lib/types";
import { EntityType } from "@/lib/types";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

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

const HISTORY_STORAGE_KEY = "music-app-history";
const MAX_HISTORY_ITEMS = 10;

export function HistoryProvider({ children }: { children: React.ReactNode }) {
	const [history, setHistory] = useState<HistoryItem[]>([]);

	// Load history from localStorage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as HistoryItem[];
				// Convert timestamp strings back to Date objects
				const withDates = parsed.map((item) => ({
					...item,
					timestamp: new Date(item.timestamp),
				}));
				setHistory(withDates);
			}
		} catch (error) {
			console.error("Failed to load history from localStorage:", error);
		}
	}, []);

	// Save history to localStorage whenever it changes
	useEffect(() => {
		try {
			localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
		} catch (error) {
			console.error("Failed to save history to localStorage:", error);
		}
	}, [history]);

	const addToHistory = useCallback((item: HistoryItem) => {
		setHistory((prev) => {
			// Remove existing item with same id if present
			const filtered = prev.filter((h) => h.id !== item.id);
			// Add new item at the beginning
			const newHistory = [item, ...filtered];
			// Keep only the last MAX_HISTORY_ITEMS
			return newHistory.slice(0, MAX_HISTORY_ITEMS);
		});
	}, []);

	const clearHistory = useCallback(() => {
		setHistory([]);
	}, []);

	const removeFromHistory = useCallback((id: string) => {
		setHistory((prev) => prev.filter((item) => item.id !== id));
	}, []);

	const value: HistoryContextType = {
		history,
		addToHistory,
		clearHistory,
		removeFromHistory,
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
