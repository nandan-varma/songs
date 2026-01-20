"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { toast } from "sonner";
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
	addSong: (song: DetailedSong) => void;
	addSongs: (songs: DetailedSong[]) => void;
	addAlbum: (album: DetailedAlbum) => void;
	addArtist: (artist: DetailedArtist) => void;
	addPlaylist: (playlist: DetailedPlaylist) => void;
	removeSong: (index: number) => void;
	reorderQueue: (fromIndex: number, toIndex: number) => void;
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
			setQueue((prev) => {
				// Check if song already exists in queue
				const isDuplicate = prev.some((s) => s.id === song.id);
				if (isDuplicate) {
					toast.info(`"${song.name}" is already in queue`);
					return prev;
				}
				return [...prev, song];
			});
		} catch (_error) {
			toast.error("Failed to add song to queue");
		}
	}, []);

	const addSongs = useCallback((songs: DetailedSong[]) => {
		try {
			setQueue((prev) => {
				// Filter out duplicates
				const existingIds = new Set(prev.map((s) => s.id));
				const newSongs = songs.filter((song) => !existingIds.has(song.id));

				if (newSongs.length === 0) {
					toast.info("All songs are already in queue");
					return prev;
				}

				const duplicateCount = songs.length - newSongs.length;
				if (duplicateCount > 0) {
					toast.info(
						`Added ${newSongs.length} songs, skipped ${duplicateCount} duplicate${duplicateCount > 1 ? "s" : ""}`,
					);
				}

				return [...prev, ...newSongs];
			});
		} catch (_error) {
			toast.error("Failed to add songs to queue");
		}
	}, []);

	const addAlbum = useCallback((album: DetailedAlbum) => {
		try {
			setQueue((prev) => [...prev, ...album.songs]);
		} catch (_error) {
			toast.error("Failed to add album to queue");
		}
	}, []);

	const addArtist = useCallback((artist: DetailedArtist) => {
		try {
			const songs = [...(artist.topSongs || []), ...(artist.singles || [])];
			setQueue((prev) => [...prev, ...songs]);
		} catch (_error) {
			toast.error("Failed to add artist to queue");
		}
	}, []);

	const addPlaylist = useCallback((playlist: DetailedPlaylist) => {
		try {
			setQueue((prev) => [...prev, ...playlist.songs]);
		} catch (_error) {
			toast.error("Failed to add playlist to queue");
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
			} catch (_error) {
				toast.error("Failed to remove song from queue");
			}
		},
		[currentIndex],
	);

	const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
		try {
			if (fromIndex === toIndex) return;

			setQueue((prev) => {
				const newQueue = [...prev];
				const [movedSong] = newQueue.splice(fromIndex, 1);
				newQueue.splice(toIndex, 0, movedSong);
				return newQueue;
			});

			// Update current index if affected
			setCurrentIndexState((prevIndex) => {
				if (prevIndex === fromIndex) {
					return toIndex;
				}
				if (fromIndex < prevIndex && toIndex >= prevIndex) {
					return prevIndex - 1;
				}
				if (fromIndex > prevIndex && toIndex <= prevIndex) {
					return prevIndex + 1;
				}
				return prevIndex;
			});
		} catch (_error) {
			toast.error("Failed to reorder queue");
		}
	}, []);

	const clearQueue = useCallback(() => {
		try {
			setQueue([]);
			setCurrentIndexState(0);
		} catch (_error) {
			toast.error("Failed to clear queue");
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
		reorderQueue,
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
