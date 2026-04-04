import { useEffect, useRef } from "react";
import {
	PREFERRED_AUDIO_QUALITY,
	type UseAudioSourceProps,
} from "@/types/player";

/**
 * Manages audio source loading with caching support
 * Handles switching between cached blobs and remote URLs
 */
export function useAudioSource({
	currentSong,
	audioRef,
	isOffline,
	getSongBlob,
}: UseAudioSourceProps) {
	const previousSongIdRef = useRef<string | null>(null);
	const blobUrlRef = useRef<string | null>(null);

	useEffect(() => {
		if (!currentSong || !audioRef.current) {
			previousSongIdRef.current = null;
			blobUrlRef.current = null;
			return;
		}

		if (previousSongIdRef.current === currentSong.id) {
			return;
		}

		const audio = audioRef.current;
		let newBlobUrl: string | null = null;

		if (blobUrlRef.current) {
			URL.revokeObjectURL(blobUrlRef.current);
			blobUrlRef.current = null;
		}

		previousSongIdRef.current = currentSong.id;

		const loadSource = async () => {
			const cachedBlob = await getSongBlob(currentSong.id);
			if (cachedBlob) {
				newBlobUrl = URL.createObjectURL(cachedBlob);
				audio.src = newBlobUrl;
				blobUrlRef.current = newBlobUrl;
			} else {
				if (isOffline) return;

				const downloadUrl =
					currentSong.downloadUrl?.find(
						(url) => url.quality === PREFERRED_AUDIO_QUALITY,
					) || currentSong.downloadUrl?.[currentSong.downloadUrl.length - 1];

				if (!downloadUrl?.url) return;
				audio.src = downloadUrl.url;
			}

			audio.currentTime = 0;
			audio.load();
		};

		void loadSource();
	}, [currentSong, audioRef, isOffline, getSongBlob]);

	useEffect(() => {
		return () => {
			if (blobUrlRef.current) {
				URL.revokeObjectURL(blobUrlRef.current);
				blobUrlRef.current = null;
			}
		};
	}, []);
}
