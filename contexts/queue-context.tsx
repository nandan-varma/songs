"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { toast } from "sonner";
import type {
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
	DetailedSong,
} from "@/types/entity";

const SHUFFLE_STORAGE_KEY = "music-app-shuffle-enabled";

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

function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = shuffled[i] as T;
		shuffled[i] = shuffled[j] as T;
		shuffled[j] = temp;
	}
	return shuffled;
}

export function QueueProvider({ children }: { children: React.ReactNode }) {
	const [queue, setQueue] = useState<DetailedSong[]>([]);
	const [currentIndex, setCurrentIndexState] = useState(0);
	const [originalQueue, setOriginalQueue] = useState<DetailedSong[]>([]);
	const [isShuffleEnabled, setIsShuffleEnabledState] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const stored = localStorage.getItem(SHUFFLE_STORAGE_KEY);
			if (stored) {
				setIsShuffleEnabledState(stored === "true");
			}
		} catch {
			// Silent error
		}
	}, []);

	const setShuffleEnabled = useCallback(
		(enabled: boolean) => {
			setIsShuffleEnabledState((prev) => {
				if (prev === enabled) return prev;

				setQueue((currentQueue) => {
					if (enabled && currentQueue.length > 0) {
						const currentSong = currentQueue[0];
						if (!currentSong) return currentQueue;
						const remainingSongs = currentQueue.slice(1);
						const shuffled = shuffleArray(remainingSongs);
						setOriginalQueue(currentQueue);
						return [currentSong, ...shuffled];
					} else if (!enabled && originalQueue.length > 0) {
						const result = originalQueue;
						setOriginalQueue([]);
						return result;
					}
					return currentQueue;
				});

				if (typeof window !== "undefined") {
					localStorage.setItem(SHUFFLE_STORAGE_KEY, String(enabled));
				}
				return enabled;
			});
		},
		[originalQueue],
	);

	const toggleShuffle = useCallback(() => {
		setShuffleEnabled(!isShuffleEnabled);
	}, [isShuffleEnabled, setShuffleEnabled]);

	const setCurrentIndex = useCallback((index: number) => {
		setCurrentIndexState(index);
	}, []);

	const addSong = useCallback((song: DetailedSong) => {
		try {
			setQueue((prev) => {
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

	const insertSongAt = useCallback(
		(song: DetailedSong, index: number) => {
			try {
				setQueue((prev) => {
					const newQueue = [...prev];
					newQueue.splice(index, 0, song);
					return newQueue;
				});

				if (index <= currentIndex) {
					setCurrentIndexState((prev) => prev + 1);
				}

				toast.success(`Playing "${song.name}" next`);
			} catch (_error) {
				toast.error("Failed to play next");
			}
		},
		[currentIndex],
	);

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
				if (movedSong) {
					newQueue.splice(toIndex, 0, movedSong);
				}
				return newQueue;
			});

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
			setOriginalQueue([]);
		} catch (_error) {
			toast.error("Failed to clear queue");
		}
	}, []);

	const value: QueueContextType = {
		queue,
		currentIndex,
		setCurrentIndex,
		isShuffleEnabled,
		toggleShuffle,
		setShuffleEnabled,
		addSong,
		addSongs,
		addAlbum,
		addArtist,
		addPlaylist,
		insertSongAt,
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
	return context;
}
