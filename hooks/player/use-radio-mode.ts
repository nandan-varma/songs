"use client";

import { useEffect, useRef } from "react";
import {
	useCurrentSong,
	useIsPlaying,
	useIsRadioEnabled,
	useQueueIndex,
	useQueueSongs,
	useRepeatMode,
} from "@/hooks/use-store";
import { getSongSuggestions } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { logError } from "@/lib/utils/logger";

/**
 * When radio mode is on, keeps playback going once the queue runs out by fetching
 * algorithmic suggestions for the last song and appending them - mirrors the native
 * app's "Radio" toggle in Core/Player/PlayerController.swift.
 */
export function useRadioMode() {
	const isRadioEnabled = useIsRadioEnabled();
	const currentSong = useCurrentSong();
	const isPlaying = useIsPlaying();
	const queueIndex = useQueueIndex();
	const queue = useQueueSongs();
	const repeatMode = useRepeatMode();
	const handledForSongId = useRef<string | null>(null);

	useEffect(() => {
		const queueEnded = queue.length > 0 && queueIndex === queue.length - 1;

		if (
			!isRadioEnabled ||
			isPlaying ||
			!currentSong ||
			repeatMode !== "off" ||
			!queueEnded
		) {
			return;
		}

		if (handledForSongId.current === currentSong.id) {
			return;
		}
		handledForSongId.current = currentSong.id;

		let cancelled = false;
		(async () => {
			try {
				const suggestions = await getSongSuggestions(currentSong.id, 10);
				if (cancelled || suggestions.length === 0) return;
				useAppStore.getState().addSongsToQueue(suggestions);
				useAppStore.getState().playNext();
			} catch (error) {
				logError("useRadioMode:continue", error);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [
		isRadioEnabled,
		isPlaying,
		currentSong,
		queueIndex,
		queue.length,
		repeatMode,
	]);
}
