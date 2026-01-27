import { toast } from "sonner";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { DetailedSong, LocalPlaylist } from "@/types/entity";

const PLAYLISTS_DB_NAME = "MusicAppPlaylistsDB";
const PLAYLISTS_VERSION = 3;
const PLAYLISTS_STORE = "playlists";

interface LocalPlaylistsStore {
	playlists: LocalPlaylist[];
	isLoading: boolean;
	loadPlaylists: () => Promise<void>;
	getPlaylist: (id: string) => LocalPlaylist | undefined;
	createPlaylist: (name: string) => Promise<string>;
	deletePlaylist: (id: string) => Promise<void>;
	renamePlaylist: (id: string, name: string) => Promise<void>;
	addSongToPlaylist: (playlistId: string, song: DetailedSong) => Promise<void>;
	removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
	reorderPlaylistSongs: (
		playlistId: string,
		fromIndex: number,
		toIndex: number,
	) => Promise<void>;
}

async function openPlaylistsDB(): Promise<IDBDatabase> {
	if (typeof window === "undefined") {
		throw new Error("IndexedDB is not available");
	}

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(PLAYLISTS_DB_NAME, PLAYLISTS_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(PLAYLISTS_STORE)) {
				db.createObjectStore(PLAYLISTS_STORE, { keyPath: "id" });
			}
		};
	});
}

async function savePlaylist(playlist: LocalPlaylist): Promise<void> {
	const db = await openPlaylistsDB();
	const transaction = db.transaction(PLAYLISTS_STORE, "readwrite");
	const store = transaction.objectStore(PLAYLISTS_STORE);
	store.put(playlist);
	return new Promise<void>((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(transaction.error);
	});
}

export const useLocalPlaylistsStore = create<LocalPlaylistsStore>()(
	subscribeWithSelector((set, get) => ({
		playlists: [],
		isLoading: false,

		loadPlaylists: async () => {
			set({ isLoading: true });
			try {
				const db = await openPlaylistsDB();
				const transaction = db.transaction(PLAYLISTS_STORE, "readonly");
				const store = transaction.objectStore(PLAYLISTS_STORE);
				const request = store.getAll();

				request.onsuccess = () => {
					const loaded = (request.result as LocalPlaylist[]) || [];
					const normalized = loaded.map((p) => {
						const hasSongs = "songs" in p && Array.isArray(p.songs);
						const hasSongIds = "songIds" in p && Array.isArray(p.songIds);

						if (hasSongIds && !hasSongs) {
							return { ...p, songs: [] };
						}
						if (!hasSongs && !hasSongIds) {
							return { ...p, songs: [] };
						}
						return p;
					});
					set({ playlists: normalized, isLoading: false });
				};

				request.onerror = () => {
					set({ playlists: [], isLoading: false });
				};
			} catch {
				set({ playlists: [], isLoading: false });
			}
		},

		getPlaylist: (id: string) => {
			const { playlists } = get();
			return playlists.find((p) => p.id === id);
		},

		createPlaylist: async (name: string) => {
			const id = crypto.randomUUID();
			const now = Date.now();
			const playlist: LocalPlaylist = {
				id,
				name,
				songs: [],
				createdAt: now,
				updatedAt: now,
			};

			try {
				await savePlaylist(playlist);
				set((state) => ({ playlists: [...state.playlists, playlist] }));
				toast.success(`Created playlist "${name}"`);
				return id;
			} catch {
				toast.error("Failed to create playlist");
				throw new Error("Failed to create playlist");
			}
		},

		deletePlaylist: async (id: string) => {
			const { playlists } = get();
			const playlist = playlists.find((p) => p.id === id);
			if (!playlist) return;

			try {
				const db = await openPlaylistsDB();
				const transaction = db.transaction(PLAYLISTS_STORE, "readwrite");
				const store = transaction.objectStore(PLAYLISTS_STORE);
				store.delete(id);

				await new Promise<void>((resolve, reject) => {
					transaction.oncomplete = () => resolve();
					transaction.onerror = () => reject(transaction.error);
				});

				set((state) => ({
					playlists: state.playlists.filter((p) => p.id !== id),
				}));
				toast.success(`Deleted playlist "${playlist.name}"`);
			} catch {
				toast.error("Failed to delete playlist");
				throw new Error("Failed to delete playlist");
			}
		},

		renamePlaylist: async (id: string, name: string) => {
			const { playlists } = get();
			const playlist = playlists.find((p) => p.id === id);
			if (!playlist) return;

			const updated = { ...playlist, name, updatedAt: Date.now() };

			try {
				await savePlaylist(updated);
				set((state) => ({
					playlists: state.playlists.map((p) => (p.id === id ? updated : p)),
				}));
				toast.success(`Renamed playlist to "${name}"`);
			} catch {
				toast.error("Failed to rename playlist");
				throw new Error("Failed to rename playlist");
			}
		},

		addSongToPlaylist: async (playlistId: string, song: DetailedSong) => {
			const { playlists } = get();
			const playlist = playlists.find((p) => p.id === playlistId);
			if (!playlist) return;

			if (playlist.songs.some((s) => s.id === song.id)) {
				toast.info("Song is already in playlist");
				return;
			}

			const updated = {
				...playlist,
				songs: [...playlist.songs, song],
				updatedAt: Date.now(),
			};

			try {
				await savePlaylist(updated);
				set((state) => ({
					playlists: state.playlists.map((p) =>
						p.id === playlistId ? updated : p,
					),
				}));
				toast.success(`Added "${song.name}" to playlist`);
			} catch {
				toast.error("Failed to add song to playlist");
				throw new Error("Failed to add song to playlist");
			}
		},

		removeSongFromPlaylist: async (playlistId: string, songId: string) => {
			const { playlists } = get();
			const playlist = playlists.find((p) => p.id === playlistId);
			if (!playlist) return;

			const updated = {
				...playlist,
				songs: playlist.songs.filter((s) => s.id !== songId),
				updatedAt: Date.now(),
			};

			try {
				await savePlaylist(updated);
				set((state) => ({
					playlists: state.playlists.map((p) =>
						p.id === playlistId ? updated : p,
					),
				}));
				toast.success("Removed song from playlist");
			} catch {
				toast.error("Failed to remove song from playlist");
				throw new Error("Failed to remove song from playlist");
			}
		},

		reorderPlaylistSongs: async (
			playlistId: string,
			fromIndex: number,
			toIndex: number,
		) => {
			const { playlists } = get();
			const playlist = playlists.find((p) => p.id === playlistId);
			if (!playlist) return;

			const songs = [...playlist.songs];
			const [movedSong] = songs.splice(fromIndex, 1);
			if (movedSong) {
				songs.splice(toIndex, 0, movedSong);
			}

			const updated = { ...playlist, songs, updatedAt: Date.now() };

			try {
				await savePlaylist(updated);
				set((state) => ({
					playlists: state.playlists.map((p) =>
						p.id === playlistId ? updated : p,
					),
				}));
			} catch {
				toast.error("Failed to reorder playlist");
				throw new Error("Failed to reorder playlist");
			}
		},
	})),
);

// Selector hooks
export const useLocalPlaylists = () =>
	useLocalPlaylistsStore((state) => ({
		playlists: state.playlists,
		getPlaylist: state.getPlaylist,
		createPlaylist: state.createPlaylist,
		deletePlaylist: state.deletePlaylist,
		renamePlaylist: state.renamePlaylist,
		addSongToPlaylist: state.addSongToPlaylist,
		removeSongFromPlaylist: state.removeSongFromPlaylist,
		reorderPlaylistSongs: state.reorderPlaylistSongs,
	}));
