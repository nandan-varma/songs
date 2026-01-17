import { type RefObject, useEffect, useRef } from "react";
import type { DetailedSong } from "@/lib/types";

interface UseAudioSourceProps {
	currentSong: DetailedSong | null;
	audioRef: RefObject<HTMLAudioElement | null>;
	isOfflineMode: boolean;
	getSongBlob: (songId: string) => Blob | null;
}

/**
 * Manages audio source loading with caching support
 * Handles switching between cached blobs and remote URLs
 */
export function useAudioSource({
	currentSong,
	audioRef,
	isOfflineMode,
	getSongBlob,
}: UseAudioSourceProps) {
	const previousSongIdRef = useRef<string | null>(null);

	useEffect(() => {
		if (!currentSong || !audioRef.current) {
			previousSongIdRef.current = null;
			return;
		}

		// Only load new source if the song ID actually changed
		if (previousSongIdRef.current === currentSong.id) {
			return;
		}

		previousSongIdRef.current = currentSong.id;
		const audio = audioRef.current;
		let blobUrl: string | null = null;

		// Try to use cached audio first, then fallback to remote URL
		const cachedBlob = getSongBlob(currentSong.id);
		if (cachedBlob) {
			blobUrl = URL.createObjectURL(cachedBlob);
			audio.src = blobUrl;
		} else {
			// In offline mode, don't try to play remote URLs
			if (isOfflineMode) return;

			const downloadUrl =
				currentSong.downloadUrl?.find((url) => url.quality === "320kbps") ||
				currentSong.downloadUrl?.[currentSong.downloadUrl.length - 1];

			if (!downloadUrl?.url) return;
			audio.src = downloadUrl.url;
		}

		// Reset state and load the new source
		audio.currentTime = 0;
		audio.load();

		// Cleanup: revoke blob URL when song changes or component unmounts
		return () => {
			if (blobUrl) {
				URL.revokeObjectURL(blobUrl);
			}
		};
	}, [currentSong, audioRef, isOfflineMode, getSongBlob]);
}
