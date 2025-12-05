"use client";

import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import type { DetailedSong } from "@/lib/types";
import { musicDB } from "@/lib/db";

export enum DownloadStatus {
	PENDING = "pending",
	DOWNLOADING = "downloading",
	COMPLETED = "completed",
	FAILED = "failed",
}

export interface DownloadItem {
	id: string;
	song: DetailedSong;
	status: DownloadStatus;
	progress: number; // 0-100
	error?: string;
	downloadedAt?: Date;
	blob?: Blob;
}

interface DownloadsState {
	downloads: DownloadItem[];
	isProcessing: boolean;
	cachedSongs: Map<string, DownloadItem>; // Map by song.id for quick lookup
}

interface DownloadsActions {
	addToDownloadQueue: (song: DetailedSong) => void;
	addMultipleToDownloadQueue: (songs: DetailedSong[]) => void;
	removeFromQueue: (songId: string) => void;
	clearQueue: () => void;
	clearCompleted: () => void;
	retryFailed: (songId: string) => void;
	saveToDevice: () => Promise<void>;
	getSongCacheBlob: (songId: string) => Blob | null;
	isSongCached: (songId: string) => boolean;
	isSongInQueue: (songId: string) => boolean;
}

const DownloadsContext = createContext<
	(DownloadsState & DownloadsActions) | undefined
>(undefined);

const CACHE_KEY = "music_app_downloads";
const MAX_CONCURRENT_DOWNLOADS = 1; // Download one song at a time

export function DownloadsProvider({ children }: { children: React.ReactNode }) {
	const [downloads, setDownloads] = useState<DownloadItem[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);
	const [cachedSongs, setCachedSongs] = useState<Map<string, DownloadItem>>(
		new Map(),
	);

	// Load cached songs from IndexedDB on mount
	useEffect(() => {
		const loadCachedSongs = async () => {
			try {
				// Try to load from IndexedDB first
				const dbSongs = await musicDB.getAllSongs();
				const cacheMap = new Map<string, DownloadItem>();

				for (const cachedSong of dbSongs) {
					const audioBlob = await musicDB.getAudioBlob(cachedSong.id);
					if (audioBlob) {
						cacheMap.set(cachedSong.id, {
							id: `${cachedSong.id}-${cachedSong.cachedAt}`,
							song: cachedSong.metadata,
							status: DownloadStatus.COMPLETED,
							progress: 100,
							downloadedAt: new Date(cachedSong.cachedAt),
							blob: audioBlob,
						});
					}
				}

				// Fallback to localStorage for migration
				if (cacheMap.size === 0) {
					const cached = localStorage.getItem(CACHE_KEY);
					if (cached) {
						const parsedCache = JSON.parse(cached);
						for (const item of parsedCache) {
							if (item.status === DownloadStatus.COMPLETED) {
								cacheMap.set(item.song.id, {
									...item,
									downloadedAt: new Date(item.downloadedAt),
								});
								// Migrate to IndexedDB
								if (item.song) {
									musicDB.saveSong(item.song).catch(console.error);
								}
							}
						}
					}
				}

				setCachedSongs(cacheMap);
			} catch (error) {
				console.error("Error loading cached songs:", error);
			}
		};

		loadCachedSongs();
	}, []);

	// Save completed downloads to localStorage
	useEffect(() => {
		const completedDownloads = Array.from(cachedSongs.values()).map(
			(item) => ({
				...item,
				blob: undefined, // Don't serialize blob data
			}),
		);

		if (completedDownloads.length > 0) {
			localStorage.setItem(CACHE_KEY, JSON.stringify(completedDownloads));
		}
	}, [cachedSongs]);

	// Download a single song
	const downloadSong = useCallback(async (downloadItem: DownloadItem) => {
		const { song } = downloadItem;

		try {
			// Get the highest quality download URL
			const downloadUrl = song.downloadUrl.find(
				(url) => url.quality === "320kbps",
			) || song.downloadUrl[0];

			if (!downloadUrl?.url) {
				throw new Error("No download URL available");
			}

			// Update status to downloading
			setDownloads((prev) =>
				prev.map((item) =>
					item.id === downloadItem.id
						? { ...item, status: DownloadStatus.DOWNLOADING, progress: 0 }
						: item,
				),
			);

			// Fetch the audio file
			const response = await fetch(downloadUrl.url);

			if (!response.ok) {
				throw new Error(`Failed to download: ${response.statusText}`);
			}

			const contentLength = response.headers.get("Content-Length");
			const total = contentLength ? parseInt(contentLength, 10) : 0;

			if (!response.body) {
				throw new Error("No response body");
			}

			const reader = response.body.getReader();
			const chunks: Uint8Array[] = [];
			let loaded = 0;

			// eslint-disable-next-line no-constant-condition
			while (true) {
				const { done, value } = await reader.read();

				if (done) break;

				chunks.push(value);
				loaded += value.length;

				// Update progress
				const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;
				setDownloads((prev) =>
					prev.map((item) =>
						item.id === downloadItem.id ? { ...item, progress } : item,
					),
				);
			}

			// Create blob from chunks
			const blob = new Blob(chunks as BlobPart[], { type: "audio/mpeg" });

			// Save to IndexedDB
			try {
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
			} catch (dbError) {
				console.error("Failed to save to IndexedDB:", dbError);
			}

			// Mark as completed and add to cache
			const completedItem: DownloadItem = {
				...downloadItem,
				status: DownloadStatus.COMPLETED,
				progress: 100,
				downloadedAt: new Date(),
				blob,
			};

			setDownloads((prev) =>
				prev.map((item) =>
					item.id === downloadItem.id ? completedItem : item,
				),
			);

			setCachedSongs((prev) => new Map(prev.set(song.id, completedItem)));
		} catch (error) {
			console.error(`Error downloading song ${song.name}:`, error);

			setDownloads((prev) =>
				prev.map((item) =>
					item.id === downloadItem.id
						? {
								...item,
								status: DownloadStatus.FAILED,
								error: error instanceof Error ? error.message : "Download failed",
							}
						: item,
				),
			);
		}
	}, []);

	// Process download queue
	useEffect(() => {
		const processQueue = async () => {
			const pendingDownloads = downloads.filter(
				(item) => item.status === DownloadStatus.PENDING,
			);
			const downloadingCount = downloads.filter(
				(item) => item.status === DownloadStatus.DOWNLOADING,
			).length;

			if (
				pendingDownloads.length > 0 &&
				downloadingCount < MAX_CONCURRENT_DOWNLOADS
			) {
				setIsProcessing(true);
				await downloadSong(pendingDownloads[0]);
			} else if (downloadingCount === 0) {
				setIsProcessing(false);
			}
		};

		processQueue();
	}, [downloads, downloadSong]);

	const addToDownloadQueue = useCallback((song: DetailedSong) => {
		const existingDownload = downloads.find((item) => item.song.id === song.id);
		if (existingDownload) return; // Already in queue

		const newItem: DownloadItem = {
			id: `${song.id}-${Date.now()}`,
			song,
			status: DownloadStatus.PENDING,
			progress: 0,
		};

		setDownloads((prev) => [...prev, newItem]);
	}, [downloads]);

	const addMultipleToDownloadQueue = useCallback((songs: DetailedSong[]) => {
		const newItems: DownloadItem[] = songs
			.filter((song) => !downloads.find((item) => item.song.id === song.id))
			.map((song) => ({
				id: `${song.id}-${Date.now()}`,
				song,
				status: DownloadStatus.PENDING,
				progress: 0,
			}));

		setDownloads((prev) => [...prev, ...newItems]);
	}, [downloads]);

	const removeFromQueue = useCallback((songId: string) => {
		setDownloads((prev) => prev.filter((item) => item.song.id !== songId));
		// Also remove from IndexedDB if it was completed
		musicDB.deleteSong(songId).catch(console.error);
		setCachedSongs((prev) => {
			const newMap = new Map(prev);
			newMap.delete(songId);
			return newMap;
		});
	}, []);

	const clearQueue = useCallback(() => {
		setDownloads((prev) =>
			prev.filter((item) => item.status === DownloadStatus.DOWNLOADING),
		);
	}, []);

	const clearCompleted = useCallback(() => {
		setDownloads((prev) =>
			prev.filter((item) => item.status !== DownloadStatus.COMPLETED),
		);
	}, []);

	const retryFailed = useCallback((songId: string) => {
		setDownloads((prev) =>
			prev.map((item) =>
				item.song.id === songId && item.status === DownloadStatus.FAILED
					? { ...item, status: DownloadStatus.PENDING, error: undefined }
					: item,
			),
		);
	}, []);

	const saveToDevice = useCallback(async () => {
		const completedDownloads = downloads.filter(
			(item) => item.status === DownloadStatus.COMPLETED && item.blob,
		);

		if (completedDownloads.length === 0) {
			alert("No completed downloads to save");
			return;
		}

		try {
			if ("showDirectoryPicker" in window) {
				// Use File System Access API for modern browsers
				const dirHandle = await (
					window as any
				).showDirectoryPicker();

				for (const download of completedDownloads) {
					if (download.blob) {
						const fileName = `${download.song.name}.mp3`
							.replace(/[<>:"/\\|?*]/g, "_")
							.replace(/\s+/g, "_");

						const fileHandle = await dirHandle.getFileHandle(fileName, {
							create: true,
						});
						const writable = await fileHandle.createWritable();
						await writable.write(download.blob);
						await writable.close();
					}
				}

				alert(`Successfully saved ${completedDownloads.length} songs!`);
			} else {
				// Fallback: download individual files
				for (const download of completedDownloads) {
					if (download.blob) {
						const url = URL.createObjectURL(download.blob);
						const a = document.createElement("a");
						a.href = url;
						a.download = `${download.song.name}.mp3`
							.replace(/[<>:"/\\|?*]/g, "_")
							.replace(/\s+/g, "_");
						document.body.appendChild(a);
						a.click();
						document.body.removeChild(a);
						URL.revokeObjectURL(url);
					}
				}
			}
		} catch (error) {
			console.error("Error saving files:", error);
			alert("Failed to save files. Please try again.");
		}
	}, [downloads]);

	const getSongCacheBlob = useCallback(
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

	const isSongInQueue = useCallback(
		(songId: string): boolean => {
			return downloads.some((item) => item.song.id === songId);
		},
		[downloads],
	);

	const value = useMemo(
		() => ({
			downloads,
			isProcessing,
			cachedSongs,
			addToDownloadQueue,
			addMultipleToDownloadQueue,
			removeFromQueue,
			clearQueue,
			clearCompleted,
			retryFailed,
			saveToDevice,
			getSongCacheBlob,
			isSongCached,
			isSongInQueue,
		}),
		[
			downloads,
			isProcessing,
			cachedSongs,
			addToDownloadQueue,
			addMultipleToDownloadQueue,
			removeFromQueue,
			clearQueue,
			clearCompleted,
			retryFailed,
			saveToDevice,
			getSongCacheBlob,
			isSongCached,
			isSongInQueue,
		],
	);

	return (
		<DownloadsContext.Provider value={value}>
			{children}
		</DownloadsContext.Provider>
	);
}

export function useDownloads() {
	const context = useContext(DownloadsContext);
	if (context === undefined) {
		throw new Error("useDownloads must be used within a DownloadsProvider");
	}
	return context;
}