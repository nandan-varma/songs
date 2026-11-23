import {
	createPlaylistId,
	moveItem,
	type StoreSet,
} from "@/lib/store/internal";
import type { AppStoreActions } from "@/lib/store/types";
import type { LocalPlaylist } from "@/types/entity";

export function createPlaylistSlice(
	set: StoreSet,
): Pick<
	AppStoreActions,
	| "createPlaylist"
	| "updatePlaylist"
	| "deletePlaylist"
	| "addSongToPlaylist"
	| "removeSongFromPlaylist"
	| "reorderPlaylistSongs"
> {
	return {
		createPlaylist: (name) => {
			const playlistName = name.trim();
			if (!playlistName) {
				throw new Error("Playlist name is required");
			}

			const now = Date.now();
			const playlist: LocalPlaylist = {
				id: createPlaylistId(),
				name: playlistName,
				songs: [],
				createdAt: now,
				updatedAt: now,
			};

			set((state) => ({ playlists: [...state.playlists, playlist] }));
			return playlist.id;
		},
		updatePlaylist: (playlistId, name) => {
			const playlistName = name.trim();
			if (!playlistName) {
				throw new Error("Playlist name is required");
			}

			set((state) => ({
				playlists: state.playlists.map((playlist) =>
					playlist.id === playlistId
						? { ...playlist, name: playlistName, updatedAt: Date.now() }
						: playlist,
				),
			}));
		},
		deletePlaylist: (playlistId) => {
			set((state) => ({
				playlists: state.playlists.filter(
					(playlist) => playlist.id !== playlistId,
				),
			}));
		},
		addSongToPlaylist: (playlistId, song) => {
			set((state) => ({
				playlists: state.playlists.map((playlist) => {
					if (playlist.id !== playlistId) {
						return playlist;
					}

					const songs = playlist.songs.some((item) => item.id === song.id)
						? playlist.songs
						: [...playlist.songs, song];

					return { ...playlist, songs, updatedAt: Date.now() };
				}),
			}));
		},
		removeSongFromPlaylist: (playlistId, songId) => {
			set((state) => ({
				playlists: state.playlists.map((playlist) =>
					playlist.id === playlistId
						? {
								...playlist,
								songs: playlist.songs.filter((song) => song.id !== songId),
								updatedAt: Date.now(),
							}
						: playlist,
				),
			}));
		},
		reorderPlaylistSongs: (playlistId, fromIndex, toIndex) => {
			set((state) => ({
				playlists: state.playlists.map((playlist) => {
					if (playlist.id !== playlistId) {
						return playlist;
					}

					if (
						fromIndex < 0 ||
						toIndex < 0 ||
						fromIndex >= playlist.songs.length ||
						toIndex >= playlist.songs.length
					) {
						return playlist;
					}

					return {
						...playlist,
						songs: moveItem(playlist.songs, fromIndex, toIndex),
						updatedAt: Date.now(),
					};
				}),
			}));
		},
	};
}
