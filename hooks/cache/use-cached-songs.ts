"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { cacheManager } from "@/lib/cache";
import { CACHE_KEYS } from "@/lib/cache/constants";
import { useAppStore } from "@/lib/store";
import type { DetailedSong } from "@/types/entity";

/**
 * Hook to get all cached/downloaded songs with their metadata
 * Combines Zustand store (source of truth for which songs are downloaded)
 * with cached song data from IndexedDB
 */
export function useCachedSongs() {
	const downloadedSongIds = useAppStore((state) => state.downloadedSongIds);

	// Fetch all cached song metadata in parallel
	const query = useQuery({
		queryKey: ["cachedSongs", Array.from(downloadedSongIds)],
		queryFn: async () => {
			if (downloadedSongIds.size === 0) {
				return [];
			}

			const songs: DetailedSong[] = [];

			// Fetch each cached song's metadata from cache
			for (const songId of downloadedSongIds) {
				try {
					const cached = await cacheManager.get(
						CACHE_KEYS.DOWNLOADS(songId),
						"AUDIO",
					);

					if (cached && typeof cached === "object") {
						// The cached object has basic info, but we might need full metadata
						// For now, return what we have from cache
						const songData = cached as {
							id: string;
							name: string;
							blob: Blob;
							downloadedAt: string;
							url: string;
						};

						// Create a minimal DetailedSong object from cached data
						// In real scenarios, this would be enriched with full metadata
						songs.push({
							id: songData.id,
							name: songData.name,
							type: "song",
							year: null,
							releaseDate: null,
							duration: null,
							label: null,
							explicitContent: false,
							playCount: null,
							language: "hindi",
							hasLyrics: false,
							lyricsId: null,
							url: songData.url,
							copyright: null,
							album: {
								id: null,
								name: null,
								url: null,
							},
							artists: {
								primary: [],
								featured: [],
								all: [],
							},
							image: [],
							downloadUrl: [],
						} as DetailedSong);
					}
				} catch (error) {
					console.error(`Failed to fetch cached song ${songId}:`, error);
					// Continue with other songs
				}
			}

			return songs;
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 10, // 10 minutes
		enabled: downloadedSongIds.size > 0,
	});

	// Memoize the result to prevent unnecessary re-renders
	const cachedSongs = useMemo(() => {
		return query.data || [];
	}, [query.data]);

	return {
		cachedSongs,
		isLoading: query.isPending,
		error: query.error,
		count: downloadedSongIds.size,
	};
}
