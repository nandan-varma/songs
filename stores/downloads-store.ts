import { toast } from "sonner";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { db } from "@/lib/db/dexie";
import { logError } from "@/lib/utils/logger";
import type { DetailedSong } from "@/types/entity";

export interface CachedSong {
	song: DetailedSong;
	blob: Blob;
	downloadedAt: Date;
}

const EMPTY_BLOB = new Blob();

interface DownloadsStore {
	// State
	cachedSongs: Map<string, CachedSong>;
	isDownloading: boolean;
	isLoaded: boolean;

	// Actions
	loadCachedSongs: () => Promise<void>;
	downloadSong: (song: DetailedSong) => Promise<void>;
	removeSong: (songId: string) => Promise<void>;
	getSongBlob: (songId: string) => Promise<Blob | null>;
	isSongCached: (songId: string) => boolean;
	isSongFullyCached: (songId: string) => Promise<boolean>;
	getCachedSong: (songId: string) => Promise<CachedSong | null>;

	// Internal helpers
	addToCache: (songId: string, cached: CachedSong) => void;
	removeFromCache: (songId: string) => void;
	ensureBlobLoaded: (songId: string) => Promise<void>;
}

export const useDownloadsStore = create<DownloadsStore>()(
	devtools(
		(set, get) => ({
			cachedSongs: new Map(),
			isDownloading: false,
			isLoaded: false,

			loadCachedSongs: async () => {
				try {
					const dbSongs = await db.getAllSongs();

					const cacheEntries = await Promise.all(
						dbSongs.map(async (cachedSong) => {
							const audioBlob = await db.getAudioBlob(cachedSong.id);
							if (cachedSong.metadata) {
								return [
									cachedSong.id,
									{
										song: cachedSong.metadata,
										blob: audioBlob || EMPTY_BLOB,
										downloadedAt: new Date(cachedSong.cachedAt),
									},
								] as [string, CachedSong];
							}
							return null;
						}),
					);

					const cacheMap = new Map<string, CachedSong>(
						cacheEntries.filter(
							(entry): entry is [string, CachedSong] => entry !== null,
						),
					);

					set({ cachedSongs: cacheMap, isLoaded: true });
				} catch (error) {
					logError("DownloadsStore.loadCachedSongs", error);
					set({ isLoaded: true });
				}
			},

			ensureBlobLoaded: async (songId: string) => {
				const { cachedSongs } = get();
				const existing = cachedSongs.get(songId);
				if (existing && existing.blob === EMPTY_BLOB) {
					const audioBlob = await db.getAudioBlob(songId);
					if (audioBlob) {
						const newMap = new Map(cachedSongs);
						newMap.set(songId, { ...existing, blob: audioBlob });
						set({ cachedSongs: newMap });
					}
				}
			},

			addToCache: (songId: string, cached: CachedSong) => {
				set((state) => {
					const newMap = new Map(state.cachedSongs);
					newMap.set(songId, cached);
					return { cachedSongs: newMap };
				});
			},

			removeFromCache: (songId: string) => {
				set((state) => {
					const newMap = new Map(state.cachedSongs);
					newMap.delete(songId);
					return { cachedSongs: newMap };
				});
			},

			getSongBlob: async (songId: string) => {
				await get().ensureBlobLoaded(songId);
				const blob = get().cachedSongs.get(songId)?.blob;
				return blob && blob !== EMPTY_BLOB ? blob : null;
			},

			isSongCached: (songId: string) => {
				return get().cachedSongs.has(songId);
			},

			isSongFullyCached: async (songId: string) => {
				await get().ensureBlobLoaded(songId);
				const song = get().cachedSongs.get(songId);
				return song !== undefined && song.blob !== EMPTY_BLOB;
			},

			getCachedSong: async (songId: string) => {
				await get().ensureBlobLoaded(songId);
				const song = get().cachedSongs.get(songId);
				if (song && song.blob !== EMPTY_BLOB) {
					return song;
				}
				return null;
			},

			downloadSong: async (song: DetailedSong) => {
				try {
					set({ isDownloading: true });

					// Save song metadata
					await db.saveSong(song);

					// Download and save audio blob
					const audioUrl =
						song.downloadUrl?.[2]?.url ||
						song.downloadUrl?.[1]?.url ||
						song.downloadUrl?.[0]?.url;
					if (!audioUrl) {
						throw new Error("No download URL available");
					}

					const response = await fetch(audioUrl);
					if (!response.ok) {
						throw new Error("Failed to download audio");
					}

					const audioBlob = await response.blob();
					await db.saveAudioBlob(song.id, audioBlob);

					// Download and save images
					if (song.image && song.image.length > 0) {
						for (const img of song.image) {
							try {
								const imgResponse = await fetch(img.url);
								if (imgResponse.ok) {
									const imgBlob = await imgResponse.blob();
									await db.saveImageBlob(`${song.id}-${img.quality}`, imgBlob, {
										songId: song.id,
										quality: img.quality,
									});
								}
							} catch {
								// Ignore individual image failures
							}
						}
					}

					// Check and evict if needed
					await db.evictOldestIfNeeded();

					// Add to cache
					get().addToCache(song.id, {
						song,
						blob: audioBlob,
						downloadedAt: new Date(),
					});

					toast.success(`Downloaded "${song.name}"`);
				} catch (error) {
					logError("DownloadsStore.downloadSong", error);
					toast.error("Failed to download song");
				} finally {
					set({ isDownloading: false });
				}
			},

			removeSong: async (songId: string) => {
				try {
					await db.deleteSong(songId);
					get().removeFromCache(songId);
					toast.success("Removed from downloads");
				} catch (error) {
					logError("DownloadsStore.removeSong", error);
					toast.error("Failed to remove song");
				}
			},
		}),
		{ name: "downloads-store" },
	),
);

// Convenience selectors
export const useDownloadsState = () => {
	const cachedSongs = useDownloadsStore((state) => state.cachedSongs);
	const isDownloading = useDownloadsStore((state) => state.isDownloading);
	const isLoaded = useDownloadsStore((state) => state.isLoaded);

	return {
		cachedSongs,
		isDownloading,
		isLoaded,
	};
};

export const useDownloadsActions = () => {
	const loadCachedSongs = useDownloadsStore((state) => state.loadCachedSongs);
	const downloadSong = useDownloadsStore((state) => state.downloadSong);
	const removeSong = useDownloadsStore((state) => state.removeSong);
	const getSongBlob = useDownloadsStore((state) => state.getSongBlob);
	const isSongCached = useDownloadsStore((state) => state.isSongCached);
	const isSongFullyCached = useDownloadsStore(
		(state) => state.isSongFullyCached,
	);
	const getCachedSong = useDownloadsStore((state) => state.getCachedSong);

	return {
		loadCachedSongs,
		downloadSong,
		removeSong,
		getSongBlob,
		isSongCached,
		isSongFullyCached,
		getCachedSong,
	};
};
