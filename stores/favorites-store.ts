import { toast } from "sonner";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { db } from "@/lib/db/dexie";
import type { DetailedSong } from "@/types/entity";

interface FavoritesStore {
	favorites: DetailedSong[];
	isLoading: boolean;
	isInitialized: boolean;

	// Actions
	loadFavorites: () => Promise<void>;
	isFavorite: (songId: string) => boolean;
	addFavorite: (song: DetailedSong) => Promise<void>;
	removeFavorite: (songId: string) => Promise<void>;
	toggleFavorite: (song: DetailedSong) => Promise<void>;
	clearAll: () => Promise<void>;
}

export const useFavoritesStore = create<FavoritesStore>()(
	devtools(
		(set, get) => ({
			favorites: [],
			isLoading: false,
			isInitialized: false,

			loadFavorites: async () => {
				try {
					set({ isLoading: true });
					const favoriteSongs = await db.getFavorites();
					set({
						favorites: favoriteSongs.map((f) => f.song),
						isLoading: false,
						isInitialized: true,
					});
				} catch {
					set({ favorites: [], isLoading: false, isInitialized: true });
				}
			},

			isFavorite: (songId: string) => {
				const { favorites } = get();
				return favorites.some((song) => song.id === songId);
			},

			addFavorite: async (song: DetailedSong) => {
				try {
					await db.addFavorite(song);
					set((state) => {
						if (state.favorites.some((s) => s.id === song.id)) return state;
						return { favorites: [...state.favorites, song] };
					});
					toast.success(`Added "${song.name}" to favorites`);
				} catch {
					toast.error("Failed to add to favorites");
				}
			},

			removeFavorite: async (songId: string) => {
				try {
					await db.removeFavorite(songId);
					set((state) => ({
						favorites: state.favorites.filter((song) => song.id !== songId),
					}));
					toast.success("Removed from favorites");
				} catch {
					toast.error("Failed to remove from favorites");
				}
			},

			toggleFavorite: async (song: DetailedSong) => {
				const { isFavorite, addFavorite, removeFavorite } = get();
				if (isFavorite(song.id)) {
					await removeFavorite(song.id);
				} else {
					await addFavorite(song);
				}
			},

			clearAll: async () => {
				try {
					const { favorites } = get();
					for (const song of favorites) {
						await db.removeFavorite(song.id);
					}
					set({ favorites: [] });
					toast.success("Cleared all favorites");
				} catch {
					toast.error("Failed to clear favorites");
				}
			},
		}),
		{ name: "favorites-store" },
	),
);
