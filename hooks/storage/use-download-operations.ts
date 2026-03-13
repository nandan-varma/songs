import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { CachedSong } from "@/hooks/data/use-cache-manager";
import { musicDB } from "@/lib/db";
import type { DetailedSong } from "@/types/entity";

interface UseDownloadOperationsProps {
	cachedSongs: Map<string, CachedSong>;
	addToCache: (songId: string, cached: CachedSong) => void;
	removeFromCache: (songId: string) => void;
}

/**
 * Handles download and deletion operations for songs
 * Manages downloading state and coordinates with IndexedDB
 */
export function useDownloadOperations({
	cachedSongs,
	addToCache,
	removeFromCache,
}: UseDownloadOperationsProps) {
	const [isDownloading, setIsDownloading] = useState(false);

	const downloadSong = useCallback(
		async (song: DetailedSong) => {
			if (isDownloading || cachedSongs.has(song.id)) return;

			setIsDownloading(true);

			try {
				const downloadUrl =
					song.downloadUrl.find((url) => url.quality === "320kbps") ||
					song.downloadUrl[0];

				if (!downloadUrl?.url) {
					throw new Error("No download URL available");
				}

				const response = await fetch(downloadUrl.url);

				if (!response.ok) {
					throw new Error(`Failed to download: ${response.statusText}`);
				}

				const blob = await response.blob();

				await musicDB.saveSong(song);
				await musicDB.saveAudioBlob(song.id, blob);

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
					} catch {
						// Silent error handling for image caching
					}
				}

				const cachedSong: CachedSong = {
					song,
					blob,
					downloadedAt: new Date(),
				};

				addToCache(song.id, cachedSong);

				await musicDB.evictOldestIfNeeded();
			} catch {
				toast.error(`Failed to download ${song.name}`);
			} finally {
				setIsDownloading(false);
			}
		},
		[isDownloading, cachedSongs, addToCache],
	);

	const removeSong = useCallback(
		(songId: string) => {
			removeFromCache(songId);
			musicDB.deleteSong(songId);
		},
		[removeFromCache],
	);

	return {
		isDownloading,
		downloadSong,
		removeSong,
	};
}
