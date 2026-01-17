import { useEffect } from "react";
import { toast } from "sonner";
import type { DetailedSong } from "@/lib/types";

interface UseOfflineSkipProps {
	currentSong: DetailedSong | null;
	isOfflineMode: boolean;
	isSongCached: (songId: string) => boolean;
	playNext: () => void;
}

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
