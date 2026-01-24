import { toast } from "sonner";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { db, type Playlist } from "@/lib/db/dexie";
import type { DetailedSong } from "@/types/entity";

interface PlaylistsStore {
	playlists: Playlist[];
	isLoading: boolean;
	isInitialized: boolean;

	// Actions
	loadPlaylists: () => Promise<void>;
	getPlaylist: (id: string) => Playlist | undefined;
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

export const usePlaylistsStore = create<PlaylistsStore>()(
	devtools(
		(set, get) => ({
			playlists: [],
			isLoading: false,
			isInitialized: false,

			loadPlaylists: async () => {
				try {
					set({ isLoading: true });
					const playlists = await db.getAllPlaylists();
					set({ playlists, isLoading: false, isInitialized: true });
				} catch {
					set({ playlists: [], isLoading: false, isInitialized: true });
				}
			},

			getPlaylist: (id: string) => {
				const { playlists } = get();
				return playlists.find((p) => p.id === id);
			},

			createPlaylist: async (name: string) => {
				const id = `playlist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
				const playlist: Playlist = {
					id,
					name,
					songs: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				};

				try {
					await db.savePlaylist(playlist);
					set((state) => ({
						playlists: [playlist, ...state.playlists],
					}));
					toast.success(`Created playlist "${name}"`);
					return id;
				} catch {
					toast.error("Failed to create playlist");
					throw new Error("Failed to create playlist");
				}
			},

			deletePlaylist: async (id: string) => {
				try {
					await db.deletePlaylist(id);
					set((state) => ({
						playlists: state.playlists.filter((p) => p.id !== id),
					}));
					toast.success("Playlist deleted");
				} catch {
					toast.error("Failed to delete playlist");
				}
			},

			renamePlaylist: async (id: string, name: string) => {
				try {
					const playlist = get().getPlaylist(id);
					if (!playlist) {
						toast.error("Playlist not found");
						return;
					}

					const updated = {
						...playlist,
						name,
						updatedAt: Date.now(),
					};

					await db.savePlaylist(updated);
					set((state) => ({
						playlists: state.playlists.map((p) => (p.id === id ? updated : p)),
					}));
					toast.success("Playlist renamed");
				} catch {
					toast.error("Failed to rename playlist");
				}
			},

			addSongToPlaylist: async (playlistId: string, song: DetailedSong) => {
				try {
					const playlist = get().getPlaylist(playlistId);
					if (!playlist) {
						toast.error("Playlist not found");
						return;
					}

					if (playlist.songs.some((s) => s.id === song.id)) {
						toast.info(`"${song.name}" is already in the playlist`);
						return;
					}

					const updated = {
						...playlist,
						songs: [...playlist.songs, song],
						updatedAt: Date.now(),
					};

					await db.savePlaylist(updated);
					set((state) => ({
						playlists: state.playlists.map((p) =>
							p.id === playlistId ? updated : p,
						),
					}));
					toast.success(`Added "${song.name}" to playlist`);
				} catch {
					toast.error("Failed to add song to playlist");
				}
			},

			removeSongFromPlaylist: async (playlistId: string, songId: string) => {
				try {
					const playlist = get().getPlaylist(playlistId);
					if (!playlist) {
						toast.error("Playlist not found");
						return;
					}

					const updated = {
						...playlist,
						songs: playlist.songs.filter((s) => s.id !== songId),
						updatedAt: Date.now(),
					};

					await db.savePlaylist(updated);
					set((state) => ({
						playlists: state.playlists.map((p) =>
							p.id === playlistId ? updated : p,
						),
					}));
					toast.success("Removed song from playlist");
				} catch {
					toast.error("Failed to remove song from playlist");
				}
			},

			reorderPlaylistSongs: async (
				playlistId: string,
				fromIndex: number,
				toIndex: number,
			) => {
				try {
					const playlist = get().getPlaylist(playlistId);
					if (!playlist) {
						toast.error("Playlist not found");
						return;
					}

					const newSongs = [...playlist.songs];
					const [removed] = newSongs.splice(fromIndex, 1);
					if (removed) {
						newSongs.splice(toIndex, 0, removed);
					}

					const updated = {
						...playlist,
						songs: newSongs,
						updatedAt: Date.now(),
					};

					await db.savePlaylist(updated);
					set((state) => ({
						playlists: state.playlists.map((p) =>
							p.id === playlistId ? updated : p,
						),
					}));
				} catch {
					toast.error("Failed to reorder songs");
				}
			},
		}),
		{ name: "playlists-store" },
	),
);
