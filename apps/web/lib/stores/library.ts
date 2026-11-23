import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Track } from "@/lib/models";

interface LocalPlaylist {
	id: string;
	name: string;
	tracks: Track[];
}

const HISTORY_LIMIT = 100;

interface LibraryState {
	favorites: Track[];
	playlists: LocalPlaylist[];
	history: Track[];
	toggleFavorite: (track: Track) => void;
	createPlaylist: (name: string, first?: Track) => string;
	deletePlaylist: (id: string) => void;
	addToPlaylist: (id: string, track: Track) => void;
	removeFromPlaylist: (id: string, trackId: string) => void;
	recordPlay: (track: Track) => void;
	clearHistory: () => void;
}

export const useLibrary = create<LibraryState>()(
	persist(
		(set) => ({
			favorites: [],
			playlists: [],
			history: [],
			toggleFavorite: (track) =>
				set(({ favorites }) => ({
					favorites: favorites.some((t) => t.id === track.id)
						? favorites.filter((t) => t.id !== track.id)
						: [track, ...favorites],
				})),
			createPlaylist: (name, first) => {
				const id = crypto.randomUUID();
				set(({ playlists }) => ({
					playlists: [...playlists, { id, name, tracks: first ? [first] : [] }],
				}));
				return id;
			},
			deletePlaylist: (id) =>
				set(({ playlists }) => ({
					playlists: playlists.filter((p) => p.id !== id),
				})),
			addToPlaylist: (id, track) =>
				set(({ playlists }) => ({
					playlists: playlists.map((p) =>
						p.id !== id || p.tracks.some((t) => t.id === track.id)
							? p
							: { ...p, tracks: [...p.tracks, track] },
					),
				})),
			removeFromPlaylist: (id, trackId) =>
				set(({ playlists }) => ({
					playlists: playlists.map((p) =>
						p.id === id
							? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) }
							: p,
					),
				})),
			recordPlay: (track) =>
				set(({ history }) => ({
					history: [track, ...history.filter((t) => t.id !== track.id)].slice(
						0,
						HISTORY_LIMIT,
					),
				})),
			clearHistory: () => set({ history: [] }),
		}),
		{ name: "songs:library", version: 1, skipHydration: true },
	),
);

export function useLibraryHydrated(): boolean {
	return useSyncExternalStore(
		(onChange) => useLibrary.persist.onFinishHydration(onChange),
		() => useLibrary.persist.hasHydrated(),
		() => false,
	);
}
