"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { cacheManager } from "@/lib/cache";
import { CACHE_KEYS } from "@/lib/cache/constants";
import { useAppStore } from "@/lib/store";
import { getDownloadUrl } from "@/lib/utils/download";
import { logError } from "@/lib/utils/logger";
import type { DetailedSong } from "@/types/entity";

/**
 * Hook to download and cache songs for offline playback
 *
 * Features:
 * - Downloads songs to IndexedDB for persistent storage
 * - Automatically retries failed downloads (max 2 attempts)
 * - Syncs download state with Zustand store
 * - Tracks cached status and manages removal
 *
 * @returns Object with download operations and status
 * @returns {(song: DetailedSong) => void} downloadSong - Trigger song download
 * @returns {boolean} isDownloading - True while download is in progress
 * @returns {Error | null} error - Last error that occurred, or null
 * @returns {(songId: string) => Promise<boolean>} isSongCached - Check if song is already cached
 * @returns {(songId: string) => void} removeSong - Remove cached song
 * @returns {boolean} isRemoving - True while removal is in progress
 *
 * @example
 * const { downloadSong, isDownloading, error, isSongCached } = useDownloadSong();
 * const isDownloaded = await isSongCached(song.id);
 * if (!isDownloaded) downloadSong(song);
 */
export function useDownloadSong() {
	/**
	 * Check if a song blob is cached in IndexedDB
	 * @param songId - Song ID to check
	 * @returns Promise resolving to true if song is cached
	 */
	const isSongCached = useCallback(async (songId: string): Promise<boolean> => {
		try {
			const cached = await cacheManager.get(
				CACHE_KEYS.DOWNLOADS(songId),
				"AUDIO",
			);
			return cached !== null;
		} catch (error) {
			logError("CheckCachedSong", error);
			return false;
		}
	}, []);

	/**
	 * Mutation to download a song and store its blob
	 * Automatically retries up to 2 times with exponential backoff
	 */
	const downloadMutation = useMutation({
		mutationFn: async (song: DetailedSong) => {
			try {
				// Find the best quality download URL
				const downloadUrl = getDownloadUrl(song, "320kbps");

				if (!downloadUrl) {
					throw new Error("No download URL available for song");
				}

				// Fetch the song audio blob
				const response = await fetch(downloadUrl);
				if (!response.ok) {
					throw new Error(`Download failed: HTTP ${response.status}`);
				}

				const blob = await response.blob();

				// Cache the song blob in IndexedDB with metadata
				await cacheManager.set(
					CACHE_KEYS.DOWNLOADS(song.id),
					{
						id: song.id,
						name: song.name,
						blob: blob,
						downloadedAt: new Date().toISOString(),
						url: downloadUrl,
					},
					undefined, // Use default TTL
					"AUDIO",
				);

				// Sync with Zustand store to track downloaded songs
				useAppStore.getState().addDownloadedSong(song.id);

				return song;
			} catch (error) {
				logError("DownloadSong", error);
				throw error;
			}
		},
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});

	/**
	 * Mutation to remove a downloaded song from cache
	 */
	const removeMutation = useMutation({
		mutationFn: async (songId: string) => {
			try {
				// Remove from IndexedDB cache
				cacheManager.invalidate(`downloads:${songId}`);

				// Sync with Zustand store
				useAppStore.getState().removeDownloadedSong(songId);
			} catch (error) {
				logError("RemoveDownloadedSong", error);
				throw error;
			}
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
