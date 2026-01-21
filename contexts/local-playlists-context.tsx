"use client";

import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import type { DetailedSong, LocalPlaylist } from "@/types/entity";

const PLAYLISTS_DB_NAME = "MusicAppPlaylistsDB";
const PLAYLISTS_VERSION = 3;
const PLAYLISTS_STORE = "playlists";

interface LocalPlaylistsContextType {
	playlists: LocalPlaylist[];
	getPlaylist: (id: string) => LocalPlaylist | undefined;
	createPlaylist: (name: string) => Promise<string>;
	deletePlaylist: (id: string) => void;
	renamePlaylist: (id: string, name: string) => void;
	addSongToPlaylist: (playlistId: string, song: DetailedSong) => void;
	removeSongFromPlaylist: (playlistId: string, songId: string) => void;
	reorderPlaylistSongs: (
		playlistId: string,
		fromIndex: number,
		toIndex: number,
	) => void;
}

const LocalPlaylistsContext = createContext<
	LocalPlaylistsContextType | undefined
>(undefined);

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

export function LocalPlaylistsProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [playlists, setPlaylists] = useState<LocalPlaylist[]>([]);
	const playlistsRef = useRef<LocalPlaylist[]>([]);

	useEffect(() => {
		playlistsRef.current = playlists;
	}, [playlists]);

	useEffect(() => {
		const loadPlaylists = async () => {
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
					setPlaylists(normalized);
				};

				request.onerror = () => {
					setPlaylists([]);
				};
			} catch {
				setPlaylists([]);
			}
		};

		loadPlaylists();
	}, []);

	const savePlaylist = useCallback(async (playlist: LocalPlaylist) => {
		const db = await openPlaylistsDB();
		const transaction = db.transaction(PLAYLISTS_STORE, "readwrite");
		const store = transaction.objectStore(PLAYLISTS_STORE);
		store.put(playlist);
		return new Promise<void>((resolve, reject) => {
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
		});
	}, []);

	const getPlaylist = useCallback((id: string) => {
		return playlistsRef.current.find((p) => p.id === id);
	}, []);

	const createPlaylist = useCallback(
		(name: string) => {
			return new Promise<string>((resolve) => {
				const id = crypto.randomUUID();
				const now = Date.now();
				const playlist: LocalPlaylist = {
					id,
					name,
					songs: [],
					createdAt: now,
					updatedAt: now,
				};

				savePlaylist(playlist)
					.then(() => {
						setPlaylists((prev) => [...prev, playlist]);
						toast.success(`Created playlist "${name}"`);
						resolve(id);
					})
					.catch(() => {
						toast.error("Failed to create playlist");
						resolve("");
					});
			});
		},
		[savePlaylist],
	);

	const deletePlaylist = useCallback((id: string) => {
		const playlist = playlistsRef.current.find((p) => p.id === id);
		if (!playlist) return;

		const deleteFromDB = async () => {
			try {
				const db = await openPlaylistsDB();
				const transaction = db.transaction(PLAYLISTS_STORE, "readwrite");
				const store = transaction.objectStore(PLAYLISTS_STORE);
				store.delete(id);

				transaction.oncomplete = () => {
					setPlaylists((prev) => prev.filter((p) => p.id !== id));
					toast.success(`Deleted playlist "${playlist.name}"`);
				};

				transaction.onerror = () => {
					toast.error("Failed to delete playlist");
				};
			} catch {
				toast.error("Failed to delete playlist");
			}
		};

		deleteFromDB();
	}, []);

	const renamePlaylist = useCallback(
		(id: string, name: string) => {
			const playlist = playlistsRef.current.find((p) => p.id === id);
			if (!playlist) return;

			const updated = { ...playlist, name, updatedAt: Date.now() };

			savePlaylist(updated)
				.then(() => {
					setPlaylists((prev) => prev.map((p) => (p.id === id ? updated : p)));
					toast.success(`Renamed playlist to "${name}"`);
				})
				.catch(() => {
					toast.error("Failed to rename playlist");
				});
		},
		[savePlaylist],
	);

	const addSongToPlaylist = useCallback(
		(playlistId: string, song: DetailedSong) => {
			const playlist = playlistsRef.current.find((p) => p.id === playlistId);
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

			savePlaylist(updated)
				.then(() => {
					setPlaylists((prev) =>
						prev.map((p) => (p.id === playlistId ? updated : p)),
					);
					toast.success(`Added "${song.name}" to playlist`);
				})
				.catch(() => {
					toast.error("Failed to add song to playlist");
				});
		},
		[savePlaylist],
	);

	const removeSongFromPlaylist = useCallback(
		(playlistId: string, songId: string) => {
			const playlist = playlistsRef.current.find((p) => p.id === playlistId);
			if (!playlist) return;

			const updated = {
				...playlist,
				songs: playlist.songs.filter((s) => s.id !== songId),
				updatedAt: Date.now(),
			};

			savePlaylist(updated)
				.then(() => {
					setPlaylists((prev) =>
						prev.map((p) => (p.id === playlistId ? updated : p)),
					);
					toast.success("Removed song from playlist");
				})
				.catch(() => {
					toast.error("Failed to remove song from playlist");
				});
		},
		[savePlaylist],
	);

	const reorderPlaylistSongs = useCallback(
		(playlistId: string, fromIndex: number, toIndex: number) => {
			const playlist = playlistsRef.current.find((p) => p.id === playlistId);
			if (!playlist) return;

			const songs = [...playlist.songs];
			const [movedSong] = songs.splice(fromIndex, 1);
			songs.splice(toIndex, 0, movedSong);

			const updated = { ...playlist, songs, updatedAt: Date.now() };

			savePlaylist(updated)
				.then(() => {
					setPlaylists((prev) =>
						prev.map((p) => (p.id === playlistId ? updated : p)),
					);
				})
				.catch(() => {
					toast.error("Failed to reorder playlist");
				});
		},
		[savePlaylist],
	);

	const value: LocalPlaylistsContextType = {
		playlists,
		getPlaylist,
		createPlaylist,
		deletePlaylist,
		renamePlaylist,
		addSongToPlaylist,
		removeSongFromPlaylist,
		reorderPlaylistSongs,
	};

	return (
		<LocalPlaylistsContext.Provider value={value}>
			{children}
		</LocalPlaylistsContext.Provider>
	);
}

export function useLocalPlaylists() {
	const context = useContext(LocalPlaylistsContext);
	if (context === undefined) {
		throw new Error(
			"useLocalPlaylists must be used within a LocalPlaylistsProvider",
		);
	}
	return context;
}
