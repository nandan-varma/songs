"use client";

import type React from "react";
import { createContext, useContext, useEffect } from "react";
import { useFavoritesStore } from "@/stores/favorites-store";
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
	const store = useFavoritesStore();

	// Load favorites on mount
	useEffect(() => {
		store.loadFavorites();
	}, [store.loadFavorites]);

	const value: FavoritesContextType = {
		favorites: store.favorites,
		isFavorite: store.isFavorite,
		toggleFavorite: store.toggleFavorite,
		addFavorite: store.addFavorite,
		removeFavorite: store.removeFavorite,
		clearAll: store.clearAll,
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
