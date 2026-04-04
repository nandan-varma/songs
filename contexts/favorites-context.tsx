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
import { cacheManager } from "@/lib/cache";
import { CACHE_KEYS } from "@/lib/cache/constants";
import type { DetailedSong } from "@/types/entity";

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

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
	const [favorites, setFavorites] = useState<DetailedSong[]>([]);

	useEffect(() => {
		const loadFavorites = async () => {
			try {
				const cached = await cacheManager.get<DetailedSong[]>(
					CACHE_KEYS.FAVORITES,
					"METADATA",
				);
				setFavorites(cached || []);
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
				setFavorites((prev) => {
					if (prev.some((s) => s.id === song.id)) return prev;
					const updated = [...prev, song];
					// Update cache
					cacheManager.set(
						CACHE_KEYS.FAVORITES,
						updated,
						undefined,
						"METADATA",
					);
					return updated;
				});
				toast.success(`Added "${song.name}" to favorites`);
			} catch {
				toast.error("Failed to add to favorites");
			}
		};

		addToDB();
	}, []);

	const removeFavorite = useCallback((songId: string) => {
		const removeFromDB = async () => {
			try {
				setFavorites((prev) => {
					const updated = prev.filter((song) => song.id !== songId);
					// Update cache
					cacheManager.set(
						CACHE_KEYS.FAVORITES,
						updated,
						undefined,
						"METADATA",
					);
					return updated;
				});
				toast.success("Removed from favorites");
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
				setFavorites([]);
				// Clear from cache
				cacheManager.set(CACHE_KEYS.FAVORITES, [], undefined, "METADATA");
				toast.success("Cleared all favorites");
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
