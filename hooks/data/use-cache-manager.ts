import { useCallback, useEffect, useState } from "react";
import { musicDB } from "@/lib/db";
import { logError } from "@/lib/utils/logger";
import type { DetailedSong } from "@/types/entity";

export interface CachedSong {
	song: DetailedSong;
	blob: Blob;
	downloadedAt: Date;
}

const EMPTY_BLOB = new Blob();

export function useCacheManager() {
	const [cachedSongs, setCachedSongs] = useState<Map<string, CachedSong>>(
		new Map(),
	);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		const loadCachedSongs = async () => {
			try {
				const dbSongs = await musicDB.getAllSongs();

				const cacheEntries = await Promise.all(
					dbSongs.map(async (cachedSong) => {
						const audioBlob = await musicDB.getAudioBlob(cachedSong.id);
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

				setCachedSongs(cacheMap);
				setIsLoaded(true);
			} catch (error) {
				logError("useCacheManager", error);
				setIsLoaded(true);
			}
		};

		loadCachedSongs();
	}, []);

	const ensureBlobLoaded = useCallback(
		async (songId: string): Promise<void> => {
			const existing = cachedSongs.get(songId);
			if (existing && existing.blob === EMPTY_BLOB) {
				const audioBlob = await musicDB.getAudioBlob(songId);
				if (audioBlob) {
					setCachedSongs((prev) => {
						const newMap = new Map(prev);
						const song = newMap.get(songId);
						if (song) {
							newMap.set(songId, { ...song, blob: audioBlob });
						}
						return newMap;
					});
				}
			}
		},
		[cachedSongs],
	);

	const addToCache = useCallback((songId: string, cached: CachedSong) => {
		setCachedSongs((prev) => new Map(prev.set(songId, cached)));
	}, []);

	const removeFromCache = useCallback((songId: string) => {
		setCachedSongs((prev) => {
			const newMap = new Map(prev);
			newMap.delete(songId);
			return newMap;
		});
	}, []);

	const getSongBlob = useCallback(
		async (songId: string): Promise<Blob | null> => {
			await ensureBlobLoaded(songId);
			const blob = cachedSongs.get(songId)?.blob;
			return blob && blob !== EMPTY_BLOB ? blob : null;
		},
		[cachedSongs, ensureBlobLoaded],
	);

	const isSongCached = useCallback(
		(songId: string): boolean => {
			return cachedSongs.has(songId);
		},
		[cachedSongs],
	);

	const isSongFullyCached = useCallback(
		async (songId: string): Promise<boolean> => {
			await ensureBlobLoaded(songId);
			const song = cachedSongs.get(songId);
			return song !== undefined && song.blob !== EMPTY_BLOB;
		},
		[cachedSongs, ensureBlobLoaded],
	);

	const getCachedSong = useCallback(
		async (songId: string): Promise<CachedSong | null> => {
			await ensureBlobLoaded(songId);
			const song = cachedSongs.get(songId);
			if (song && song.blob !== EMPTY_BLOB) {
				return song;
			}
			return null;
		},
		[cachedSongs, ensureBlobLoaded],
	);

	const getAllCachedSongs = useCallback((): ReadonlyMap<string, CachedSong> => {
		return cachedSongs;
	}, [cachedSongs]);

	return {
		cachedSongs,
		isLoaded,
		addToCache,
		removeFromCache,
		getSongBlob,
		isSongCached,
		isSongFullyCached,
		getCachedSong,
		getAllCachedSongs,
	};
}
