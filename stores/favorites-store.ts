import { toast } from "sonner";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { favoritesStorage } from "@/lib/storage";
import type { DetailedSong } from "@/types/entity";

interface FavoritesStore {
	favorites: DetailedSong[];
	isLoading: boolean;
	isFavorite: (songId: string) => boolean;
	loadFavorites: () => Promise<void>;
	toggleFavorite: (song: DetailedSong) => Promise<void>;
	addFavorite: (song: DetailedSong) => Promise<void>;
	removeFavorite: (songId: string) => Promise<void>;
	clearAll: () => Promise<void>;
}

export const useFavoritesStore = create<FavoritesStore>()(
	subscribeWithSelector((set, get) => ({
		favorites: [],
		isLoading: false,

		isFavorite: (songId: string) => {
			const { favorites } = get();
			return favorites.some((song) => song.id === songId);
		},

		loadFavorites: async () => {
			set({ isLoading: true });
			try {
				const items = await favoritesStorage.getAll();
				set({ favorites: items, isLoading: false });
			} catch {
				set({ favorites: [], isLoading: false });
			}
		},

		addFavorite: async (song: DetailedSong) => {
			try {
				await favoritesStorage.add(song);
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
				await favoritesStorage.remove(songId);
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
				await favoritesStorage.clear();
				set({ favorites: [] });
				toast.success("Cleared all favorites");
			} catch {
				toast.error("Failed to clear favorites");
			}
		},
	})),
);

// Selector hooks
export const useFavorites = () =>
	useFavoritesStore((state) => ({
		favorites: state.favorites,
		isFavorite: state.isFavorite,
		toggleFavorite: state.toggleFavorite,
		addFavorite: state.addFavorite,
		removeFavorite: state.removeFavorite,
		clearAll: state.clearAll,
	}));
