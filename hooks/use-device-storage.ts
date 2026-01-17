import { useCallback } from "react";
import { toast } from "sonner";
import type { CachedSong } from "./use-cache-manager";

// TypeScript: Add showDirectoryPicker to window type
declare global {
	interface Window {
		showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
	}
}

interface UseDeviceStorageProps {
	cachedSongs: Map<string, CachedSong>;
}

/**
 * Manages saving cached songs to device storage
 * Uses File System Access API for directory selection
 */
export function useDeviceStorage({ cachedSongs }: UseDeviceStorageProps) {
	const saveToDevice = useCallback(async () => {
		const cachedSongsArray = Array.from(cachedSongs.values());

		if (cachedSongsArray.length === 0) {
			toast.info("No downloaded songs to save");
			return;
		}

		try {
			if (typeof window.showDirectoryPicker !== "function") {
				toast.error(
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
				} catch (_fileError) {
					// Silent error handling for individual file save
				}
			}

			toast.success(
				`Successfully saved ${cachedSongsArray.length} song${cachedSongsArray.length > 1 ? "s" : ""}!`,
			);
		} catch (_error) {
			toast.error("Failed to save files. Please try again.");
		}
	}, [cachedSongs]);

	return {
		saveToDevice,
	};
}
