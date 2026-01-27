"use client";

import type React from "react";
import { createContext, useContext, useEffect } from "react";
import { useLocalPlaylistsStore } from "@/stores/playlists-store";
import type { DetailedSong, LocalPlaylist } from "@/types/entity";

interface LocalPlaylistsContextType {
	playlists: LocalPlaylist[];
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

const LocalPlaylistsContext = createContext<
	LocalPlaylistsContextType | undefined
>(undefined);

export function LocalPlaylistsProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const store = useLocalPlaylistsStore();

	// Load playlists on mount
	useEffect(() => {
		store.loadPlaylists();
	}, [store.loadPlaylists]);

	const value: LocalPlaylistsContextType = {
		playlists: store.playlists,
		getPlaylist: store.getPlaylist,
		createPlaylist: store.createPlaylist,
		deletePlaylist: store.deletePlaylist,
		renamePlaylist: store.renamePlaylist,
		addSongToPlaylist: store.addSongToPlaylist,
		removeSongFromPlaylist: store.removeSongFromPlaylist,
		reorderPlaylistSongs: store.reorderPlaylistSongs,
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
