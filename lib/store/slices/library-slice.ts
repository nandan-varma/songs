import {
	dedupeByEntity,
	dedupeById,
	dedupeStrings,
	type StoreGet,
	type StoreSet,
} from "@/lib/store/internal";
import type { AppStoreActions } from "@/lib/store/types";

export function createLibrarySlice(
	set: StoreSet,
	get: StoreGet,
): Pick<
	AppStoreActions,
	| "toggleFavorite"
	| "isFavorite"
	| "addFavorite"
	| "removeFavorite"
	| "addToSearchHistory"
	| "clearSearchHistory"
	| "addToPlaybackHistory"
	| "clearPlaybackHistory"
	| "addToVisitHistory"
	| "clearVisitHistory"
> {
	return {
		toggleFavorite: (songId) => {
			set((state) => {
				const favoriteIds = new Set(state.favoriteIds);
				if (favoriteIds.has(songId)) {
					favoriteIds.delete(songId);
				} else {
					favoriteIds.add(songId);
				}

				return { favoriteIds };
			});
		},
		isFavorite: (songId) => get().favoriteIds.has(songId),
		addFavorite: (songId) => {
			set((state) => ({ favoriteIds: new Set(state.favoriteIds).add(songId) }));
		},
		removeFavorite: (songId) => {
			set((state) => {
				const favoriteIds = new Set(state.favoriteIds);
				favoriteIds.delete(songId);
				return { favoriteIds };
			});
		},
		addToSearchHistory: (query) => {
			const trimmedQuery = query.trim();
			if (!trimmedQuery) {
				return;
			}

			set((state) => ({
				searchHistory: dedupeStrings(
					state.searchHistory,
					trimmedQuery,
					state.maxHistorySize,
				),
			}));
		},
		clearSearchHistory: () => {
			set({ searchHistory: [] });
		},
		addToPlaybackHistory: (song) => {
			set((state) => ({
				playbackHistory: dedupeById(
					state.playbackHistory,
					song,
					state.maxHistorySize,
				),
			}));
		},
		clearPlaybackHistory: () => {
			set({ playbackHistory: [] });
		},
		addToVisitHistory: (visit) => {
			set((state) => ({
				visitHistory: dedupeByEntity(
					state.visitHistory,
					visit,
					state.maxHistorySize,
				),
			}));
		},
		clearVisitHistory: () => {
			set({ visitHistory: [] });
		},
	};
}
