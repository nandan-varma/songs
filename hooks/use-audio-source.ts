import { type RefObject, useEffect, useRef } from "react";
import type { DetailedSong } from "@/lib/types";
import { PREFERRED_AUDIO_QUALITY } from "@/types/player";

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

		if (previousSongIdRef.current === currentSong.id) {
			return;
		}

		previousSongIdRef.current = currentSong.id;
		const audio = audioRef.current;
		let blobUrl: string | null = null;

		const cachedBlob = getSongBlob(currentSong.id);
		if (cachedBlob) {
			blobUrl = URL.createObjectURL(cachedBlob);
			audio.src = blobUrl;
		} else {
			if (isOfflineMode) return;

			const downloadUrl =
				currentSong.downloadUrl?.find(
					(url) => url.quality === PREFERRED_AUDIO_QUALITY,
				) || currentSong.downloadUrl?.[currentSong.downloadUrl.length - 1];

			if (!downloadUrl?.url) return;
			audio.src = downloadUrl.url;
		}

		audio.currentTime = 0;
		audio.load();

		return () => {
			if (blobUrl) {
				URL.revokeObjectURL(blobUrl);
			}
		};
	}, [currentSong, audioRef, isOfflineMode, getSongBlob]);
}
