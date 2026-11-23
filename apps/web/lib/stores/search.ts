import { create } from "zustand";
import { persist } from "zustand/middleware";

const RECENT_LIMIT = 8;

interface SearchState {
	recents: string[];
	remember: (query: string) => void;
	clear: () => void;
}

export const useSearchHistory = create<SearchState>()(
	persist(
		(set) => ({
			recents: [],
			remember: (query) => {
				const trimmed = query.trim();
				if (!trimmed) return;
				set(({ recents }) => ({
					recents: [
						trimmed,
						...recents.filter((r) => r.toLowerCase() !== trimmed.toLowerCase()),
					].slice(0, RECENT_LIMIT),
				}));
			},
			clear: () => set({ recents: [] }),
		}),
		{ name: "songs:search", version: 1, skipHydration: true },
	),
);
