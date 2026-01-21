"use client";

import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { toast } from "sonner";
import type { DetailedSong } from "@/types/entity";

const FAVORITES_DB_NAME = "MusicAppFavoritesDB";
const FAVORITES_VERSION = 1;
const FAVORITES_STORE = "favorites";

interface FavoritesContextType {
	favorites: DetailedSong[];
	isFavorite: (songId: string) => boolean;
	toggleFavorite: (song: DetailedSong) => void;
	addFavorite: (song: DetailedSong) => void;
	removeFavorite: (songId: string) => void;
	clearAll: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
	undefined,
);

async function openFavoritesDB(): Promise<IDBDatabase> {
	if (typeof window === "undefined") {
		throw new Error("IndexedDB is not available");
	}

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(FAVORITES_DB_NAME, FAVORITES_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
				db.createObjectStore(FAVORITES_STORE, { keyPath: "songId" });
			}
		};
	});
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
	const [favorites, setFavorites] = useState<DetailedSong[]>([]);

	useEffect(() => {
		const loadFavorites = async () => {
			try {
				const db = await openFavoritesDB();
				const transaction = db.transaction(FAVORITES_STORE, "readonly");
				const store = transaction.objectStore(FAVORITES_STORE);
				const request = store.getAll();

				request.onsuccess = () => {
					const items = request.result as Array<{ song: DetailedSong }>;
					setFavorites(items.map((item) => item.song));
				};

				request.onerror = () => {
					setFavorites([]);
				};
			} catch {
				setFavorites([]);
			}
		};

		loadFavorites();
	}, []);

	const isFavorite = useCallback(
		(songId: string) => {
			return favorites.some((song) => song.id === songId);
		},
		[favorites],
	);

	const addFavorite = useCallback((song: DetailedSong) => {
		const addToDB = async () => {
			try {
				const db = await openFavoritesDB();
				const transaction = db.transaction(FAVORITES_STORE, "readwrite");
				const store = transaction.objectStore(FAVORITES_STORE);
				store.put({
					songId: song.id,
					song,
					addedAt: Date.now(),
				});

				transaction.oncomplete = () => {
					setFavorites((prev) => {
						if (prev.some((s) => s.id === song.id)) return prev;
						return [...prev, song];
					});
					toast.success(`Added "${song.name}" to favorites`);
				};

				transaction.onerror = () => {
					toast.error("Failed to add to favorites");
				};
			} catch {
				toast.error("Failed to add to favorites");
			}
		};

		addToDB();
	}, []);

	const removeFavorite = useCallback((songId: string) => {
		const removeFromDB = async () => {
			try {
				const db = await openFavoritesDB();
				const transaction = db.transaction(FAVORITES_STORE, "readwrite");
				const store = transaction.objectStore(FAVORITES_STORE);
				store.delete(songId);

				transaction.oncomplete = () => {
					setFavorites((prev) => prev.filter((song) => song.id !== songId));
					toast.success("Removed from favorites");
				};

				transaction.onerror = () => {
					toast.error("Failed to remove from favorites");
				};
			} catch {
				toast.error("Failed to remove from favorites");
			}
		};

		removeFromDB();
	}, []);

	const toggleFavorite = useCallback(
		(song: DetailedSong) => {
			if (isFavorite(song.id)) {
				removeFavorite(song.id);
			} else {
				addFavorite(song);
			}
		},
		[isFavorite, addFavorite, removeFavorite],
	);

	const clearAll = useCallback(() => {
		const clearDB = async () => {
			try {
				const db = await openFavoritesDB();
				const transaction = db.transaction(FAVORITES_STORE, "readwrite");
				const store = transaction.objectStore(FAVORITES_STORE);
				store.clear();

				transaction.oncomplete = () => {
					setFavorites([]);
					toast.success("Cleared all favorites");
				};

				transaction.onerror = () => {
					toast.error("Failed to clear favorites");
				};
			} catch {
				toast.error("Failed to clear favorites");
			}
		};

		clearDB();
	}, []);

	const value: FavoritesContextType = {
		favorites,
		isFavorite,
		toggleFavorite,
		addFavorite,
		removeFavorite,
		clearAll,
	};

	return (
		<FavoritesContext.Provider value={value}>
			{children}
		</FavoritesContext.Provider>
	);
}

export function useFavorites() {
	const context = useContext(FavoritesContext);
	if (context === undefined) {
		throw new Error("useFavorites must be used within a FavoritesProvider");
	}
	return context;
}
