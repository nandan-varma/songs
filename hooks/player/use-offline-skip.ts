import { useEffect } from "react";
import { toast } from "sonner";
import type { UseOfflineSkipProps } from "@/types/player";

/**
 * Automatically skips uncached songs in offline mode
 */
export function useOfflineSkip({
	currentSong,
	isOfflineMode,
	isSongCached,
	playNext,
}: UseOfflineSkipProps) {
	useEffect(() => {
		if (!currentSong || !isOfflineMode) return;

		if (!isSongCached(currentSong.id)) {
			toast.error(
				`"${currentSong.name}" is not available offline. Skipping...`,
			);
			playNext();
		}
	}, [currentSong, isOfflineMode, isSongCached, playNext]);
}
