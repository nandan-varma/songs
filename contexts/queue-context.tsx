"use client";

import type React from "react";
import { createContext, useContext } from "react";
import { usePlayerStore } from "@/stores/player-store";
import type {
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
	DetailedSong,
} from "@/types/entity";

interface QueueContextType {
	queue: DetailedSong[];
	currentIndex: number;
	setCurrentIndex: (index: number) => void;
	isShuffleEnabled: boolean;
	toggleShuffle: () => void;
	setShuffleEnabled: (enabled: boolean) => void;
	addSong: (song: DetailedSong) => void;
	addSongs: (songs: DetailedSong[]) => void;
	addAlbum: (album: DetailedAlbum) => void;
	addArtist: (artist: DetailedArtist) => void;
	addPlaylist: (playlist: DetailedPlaylist) => void;
	insertSongAt: (song: DetailedSong, index: number) => void;
	removeSong: (index: number) => void;
	reorderQueue: (fromIndex: number, toIndex: number) => void;
	clearQueue: () => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export function QueueProvider({ children }: { children: React.ReactNode }) {
	const store = usePlayerStore();

	const value: QueueContextType = {
		queue: store.queue,
		currentIndex: store.currentIndex,
		setCurrentIndex: store.setCurrentIndex,
		isShuffleEnabled: store.isShuffleEnabled,
		toggleShuffle: () => store.setShuffleEnabled(!store.isShuffleEnabled),
		setShuffleEnabled: store.setShuffleEnabled,
		addSong: store.addSong,
		addSongs: store.addSongs,
		addAlbum: (album) => store.addSongs(album.songs),
		addArtist: (artist) => {
			const songs = [...(artist.topSongs || []), ...(artist.singles || [])];
			store.addSongs(songs);
		},
		addPlaylist: (playlist) => store.addSongs(playlist.songs),
		insertSongAt: (song, index) => {
			// For insertSongAt, we need to implement it in the store or handle differently
			// For now, just add to queue
			store.addSong(song);
		},
		removeSong: store.removeSong,
		reorderQueue: store.reorderQueue,
		clearQueue: store.clearQueue,
	};

	return (
		<QueueContext.Provider value={value}>{children}</QueueContext.Provider>
	);
}

export function useQueueActions() {
	const context = useContext(QueueContext);
	if (context === undefined) {
		throw new Error("useQueueActions must be used within a QueueProvider");
	}
	return context;
}

export function useQueue() {
	const context = useContext(QueueContext);
	if (context === undefined) {
		throw new Error("useQueue must be used within a QueueProvider");
	}
	return context;
}
