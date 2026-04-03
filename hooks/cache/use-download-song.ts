"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { cacheManager } from "@/lib/cache";
import { CACHE_KEYS } from "@/lib/cache/constants";
import type { DetailedSong } from "@/types/entity";

/**
 * Hook to download and cache songs for offline playback
 * Downloads to IndexedDB with automatic retry and error handling
 */
export function useDownloadSong() {
	// Check if a song is cached
	const isSongCached = useCallback(async (songId: string): Promise<boolean> => {
		const cached = await cacheManager.get(
			CACHE_KEYS.DOWNLOADS(songId),
			"AUDIO",
		);
		return cached !== null;
	}, []);

	// Query to check if a song is cached
	const { data: isCached = false } = useQuery({
		queryKey: CACHE_KEYS.DOWNLOADS("status"),
		queryFn: async () => {
			// This is just a placeholder - actual usage will be in components
			return false;
		},
		staleTime: 1000 * 60 * 60, // 1 hour
	});

	// Mutation to download a song
	const downloadMutation = useMutation({
		mutationFn: async (song: DetailedSong) => {
			// Find best quality download URL
			const downloadTarget =
				song.downloadUrl.find((url) => url.quality === "320kbps") ||
				song.downloadUrl[song.downloadUrl.length - 1] ||
				song.downloadUrl[0];

			if (!downloadTarget?.url) {
				throw new Error("No download URL available");
			}

			// Fetch the song blob
			const response = await fetch(downloadTarget.url);
			if (!response.ok) {
				throw new Error(`Download failed: ${response.status}`);
			}

			const blob = await response.blob();

			// Cache the song
			await cacheManager.set(
				CACHE_KEYS.DOWNLOADS(song.id),
				{
					id: song.id,
					name: song.name,
					blob: blob,
					downloadedAt: new Date().toISOString(),
					url: downloadTarget.url,
				},
				undefined, // Use default TTL
				"AUDIO",
			);

			return song;
		},
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});

	// Mutation to remove a downloaded song
	const removeMutation = useMutation({
		mutationFn: async (songId: string) => {
			cacheManager.invalidate(`downloads:${songId}`);
		},
	});

	return {
		downloadSong: downloadMutation.mutate,
		isDownloading: downloadMutation.isPending,
		error: downloadMutation.error,
		isSongCached,
		removeSong: removeMutation.mutate,
		isRemoving: removeMutation.isPending,
	};
}
