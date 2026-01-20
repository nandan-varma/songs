import { useCallback, useEffect, useState } from "react";
import { musicDB } from "@/lib/db";
import type { DetailedSong } from "@/types/entity";

export interface CachedSong {
	song: DetailedSong;
	blob: Blob;
	downloadedAt: Date;
}

/**
 * Manages in-memory cache of downloaded songs
 * Loads from IndexedDB on mount and provides cache operations
 */
export function useCacheManager() {
	const [cachedSongs, setCachedSongs] = useState<Map<string, CachedSong>>(
		new Map(),
	);

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
			} catch (_error) {
				// Silent error handling for cached songs loading
			}
		};

		loadCachedSongs();
	}, []);

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

	return {
		cachedSongs,
		addToCache,
		removeFromCache,
		getSongBlob,
		isSongCached,
	};
}
