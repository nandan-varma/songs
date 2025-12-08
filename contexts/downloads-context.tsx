"use client";

// TypeScript: Add showDirectoryPicker to window type
declare global {
	interface Window {
		showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
	}
}

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { musicDB } from "@/lib/db";
import type { DetailedSong } from "@/lib/types";

export interface CachedSong {
	song: DetailedSong;
	blob: Blob;
	downloadedAt: Date;
}

interface DownloadsState {
	cachedSongs: Map<string, CachedSong>;
	isDownloading: boolean;
}

interface DownloadsActions {
	downloadSong: (song: DetailedSong) => Promise<void>;
	removeSong: (songId: string) => void;
	getSongBlob: (songId: string) => Blob | null;
	isSongCached: (songId: string) => boolean;
	saveToDevice: () => Promise<void>;
}

const DownloadsStateContext = createContext<DownloadsState | undefined>(
	undefined,
);
const DownloadsActionsContext = createContext<DownloadsActions | undefined>(
	undefined,
);

export function DownloadsProvider({ children }: { children: ReactNode }) {
	const [cachedSongs, setCachedSongs] = useState<Map<string, CachedSong>>(
		new Map(),
	);
	const [isDownloading, setIsDownloading] = useState(false);

	// Load cached songs from IndexedDB on mount
	useEffect(() => {
		const loadCachedSongs = async () => {
			try {
				const dbSongs = await musicDB.getAllSongs();
				const cacheMap = new Map<string, CachedSong>();

				for (const cachedSong of dbSongs) {
					const audioBlob = await musicDB.getAudioBlob(cachedSong.id);
					if (audioBlob && cachedSong.metadata) {
						cacheMap.set(cachedSong.id, {
							song: cachedSong.metadata,
							blob: audioBlob,
							downloadedAt: new Date(cachedSong.cachedAt),
						});
					}
				}

				setCachedSongs(cacheMap);
			} catch (error) {
				console.error("Error loading cached songs:", error);
			}
		};

		loadCachedSongs();
	}, []);

	const downloadSong = useCallback(
		async (song: DetailedSong) => {
			if (isDownloading || cachedSongs.has(song.id)) return;

			setIsDownloading(true);

			try {
				// Get the highest quality download URL
				const downloadUrl =
					song.downloadUrl.find((url) => url.quality === "320kbps") ||
					song.downloadUrl[0];

				if (!downloadUrl?.url) {
					throw new Error("No download URL available");
				}

				// Fetch the audio file
				const response = await fetch(downloadUrl.url);

				if (!response.ok) {
					throw new Error(`Failed to download: ${response.statusText}`);
				}

				const blob = await response.blob();

				// Save to IndexedDB
				await musicDB.saveSong(song);
				await musicDB.saveAudioBlob(song.id, blob);

				// Cache images
				for (const img of song.image) {
					try {
						const imgResponse = await fetch(img.url);
						if (imgResponse.ok) {
							const imgBlob = await imgResponse.blob();
							await musicDB.saveImageBlob(
								`${song.id}-${img.quality}`,
								imgBlob,
								{ songId: song.id, quality: img.quality },
							);
						}
					} catch (imgError) {
						console.warn(`Failed to cache image for ${song.id}:`, imgError);
					}
				}

				// Add to cache
				const cachedSong: CachedSong = {
					song,
					blob,
					downloadedAt: new Date(),
				};

				setCachedSongs((prev) => new Map(prev.set(song.id, cachedSong)));
			} catch (error) {
				console.error(`Error downloading song ${song.name}:`, error);
			} finally {
				setIsDownloading(false);
			}
		},
		[isDownloading, cachedSongs],
	);

	const removeSong = useCallback((songId: string) => {
		setCachedSongs((prev) => {
			const newMap = new Map(prev);
			newMap.delete(songId);
			return newMap;
		});
		// Remove from IndexedDB
		musicDB.deleteSong(songId).catch(console.error);
	}, []);

	const getSongBlob = useCallback(
		(songId: string): Blob | null => {
			return cachedSongs.get(songId)?.blob || null;
		},
		[cachedSongs],
	);

	const isSongCached = useCallback(
		(songId: string): boolean => {
			return cachedSongs.has(songId);
		},
		[cachedSongs],
	);

	const saveToDevice = useCallback(async () => {
		const cachedSongsArray = Array.from(cachedSongs.values());

		if (cachedSongsArray.length === 0) {
			alert("No downloaded songs to save");
			return;
		}

		try {
			if (typeof window.showDirectoryPicker !== "function") {
				alert(
					"Your browser does not support saving files to a folder. Please use a Chromium-based browser.",
				);
				return;
			}

			const dirHandle = await window.showDirectoryPicker();

			for (const cachedSong of cachedSongsArray) {
				// Sanitize file name
				let fileName = `${cachedSong.song.name || "song"}`;
				fileName = fileName.replace(/[<>:"/\\|?*]/g, "_").replace(/\s+/g, "_");
				if (!fileName.endsWith(".mp3")) fileName += ".mp3";

				try {
					const fileHandle = await dirHandle.getFileHandle(fileName, {
						create: true,
					});
					const writable = await fileHandle.createWritable();
					await writable.write(cachedSong.blob);
					await writable.close();
				} catch (fileError) {
					console.error(`Failed to save ${fileName}:`, fileError);
				}
			}

			alert(
				`Successfully saved ${cachedSongsArray.length} song${cachedSongsArray.length > 1 ? "s" : ""}!`,
			);
		} catch (error) {
			console.error("Error saving files:", error);
			alert("Failed to save files. Please try again.");
		}
	}, [cachedSongs]);

	const stateValue = useMemo(
		() => ({
			cachedSongs,
			isDownloading,
		}),
		[cachedSongs, isDownloading],
	);

	const actionsValue = useMemo(
		() => ({
			downloadSong,
			removeSong,
			getSongBlob,
			isSongCached,
			saveToDevice,
		}),
		[downloadSong, removeSong, getSongBlob, isSongCached, saveToDevice],
	);

	return (
		<DownloadsStateContext.Provider value={stateValue}>
			<DownloadsActionsContext.Provider value={actionsValue}>
				{children}
			</DownloadsActionsContext.Provider>
		</DownloadsStateContext.Provider>
	);
}

export function useDownloadsState() {
	const context = useContext(DownloadsStateContext);
	if (context === undefined) {
		throw new Error(
			"useDownloadsState must be used within a DownloadsProvider",
		);
	}
	return context;
}

export function useDownloadsActions() {
	const context = useContext(DownloadsActionsContext);
	if (context === undefined) {
		throw new Error(
			"useDownloadsActions must be used within a DownloadsProvider",
		);
	}
	return context;
}

export function useDownloads() {
	return {
		...useDownloadsState(),
		...useDownloadsActions(),
	};
}
