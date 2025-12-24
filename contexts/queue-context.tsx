"use client";

import { toast } from "sonner";
import { createContext, useCallback, useContext, useState } from "react";
import type {
	DetailedSong,
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
} from "@/lib/types";

interface QueueContextType {
	queue: DetailedSong[];
	currentIndex: number;
	setCurrentIndex: (index: number) => void;
	addSong: (song: DetailedSong) => void;
	addSongs: (songs: DetailedSong[]) => void;
	addAlbum: (album: DetailedAlbum) => void;
	addArtist: (artist: DetailedArtist) => void;
	addPlaylist: (playlist: DetailedPlaylist) => void;
	removeSong: (index: number) => void;
	clearQueue: () => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export function QueueProvider({ children }: { children: React.ReactNode }) {
	const [queue, setQueue] = useState<DetailedSong[]>([]);
	const [currentIndex, setCurrentIndexState] = useState(0);

	const setCurrentIndex = useCallback((index: number) => {
		setCurrentIndexState(index);
	}, []);

	const addSong = useCallback((song: DetailedSong) => {
		try {
			setQueue((prev) => [...prev, song]);
		} catch (error) {
			toast.error("Failed to add song to queue");
			console.error(error);
		}
	}, []);

	const addSongs = useCallback((songs: DetailedSong[]) => {
		try {
			setQueue((prev) => [...prev, ...songs]);
		} catch (error) {
			toast.error("Failed to add songs to queue");
			console.error(error);
		}
	}, []);

	const addAlbum = useCallback((album: DetailedAlbum) => {
		try {
			setQueue((prev) => [...prev, ...album.songs]);
		} catch (error) {
			toast.error("Failed to add album to queue");
			console.error(error);
		}
	}, []);

	const addArtist = useCallback((artist: DetailedArtist) => {
		try {
			const songs = [...(artist.topSongs || []), ...(artist.singles || [])];
			setQueue((prev) => [...prev, ...songs]);
		} catch (error) {
			toast.error("Failed to add artist to queue");
			console.error(error);
		}
	}, []);

	const addPlaylist = useCallback((playlist: DetailedPlaylist) => {
		try {
			setQueue((prev) => [...prev, ...playlist.songs]);
		} catch (error) {
			toast.error("Failed to add playlist to queue");
			console.error(error);
		}
	}, []);

	const removeSong = useCallback(
		(index: number) => {
			try {
				setQueue((prev) => {
					const newQueue = prev.filter((_, i) => i !== index);
					if (index === currentIndex) {
						if (newQueue.length > 0) {
							setCurrentIndexState(Math.min(currentIndex, newQueue.length - 1));
						} else {
							setCurrentIndexState(0);
						}
					} else if (index < currentIndex) {
						setCurrentIndexState(currentIndex - 1);
					}
					return newQueue;
				});
			} catch (error) {
				toast.error("Failed to remove song from queue");
				console.error(error);
			}
		},
		[currentIndex],
	);

	const clearQueue = useCallback(() => {
		try {
			setQueue([]);
			setCurrentIndexState(0);
		} catch (error) {
			toast.error("Failed to clear queue");
			console.error(error);
		}
	}, []);

	const value: QueueContextType = {
		queue,
		currentIndex,
		setCurrentIndex,
		addSong,
		addSongs,
		addAlbum,
		addArtist,
		addPlaylist,
		removeSong,
		clearQueue,
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
	return { queue: context.queue, currentIndex: context.currentIndex };
}
