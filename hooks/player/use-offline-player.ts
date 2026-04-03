import { toast } from "sonner";
import { usePlayerActions } from "@/contexts/player-context";
import { useOffline } from "@/hooks/cache";
import type { DetailedSong } from "@/types/entity";

/**
 * Offline-aware player actions that automatically filter songs based on offline mode
 */
export function useOfflinePlayerActions() {
	const isOfflineMode = useOffline();
	const {
		playQueue,
		addToQueue,
		addMultipleToQueue,
		playSong,
		...otherActions
	} = usePlayerActions();

	const playSongOfflineAware = (song: DetailedSong, replaceQueue = true) => {
		const filtered = [song];

		if (filtered.length === 0 && isOfflineMode) {
			toast.error("Song not available offline");
			return;
		}

		playSong(song, replaceQueue);
	};

	const playQueueOfflineAware = (songs: DetailedSong[], startIndex = 0) => {
		const filtered = songs;

		if (filtered.length === 0) {
			if (isOfflineMode) {
				toast.error("No cached songs available for offline playback");
			}
			return;
		}

		if (filtered.length < songs.length && isOfflineMode) {
			toast.info(
				`Playing ${filtered.length} of ${songs.length} songs (offline mode)`,
			);
		}

		const validStartIndex = Math.min(startIndex, filtered.length - 1);
		playQueue(filtered, validStartIndex);
	};

	const addToQueueOfflineAware = (song: DetailedSong) => {
		const filtered = [song];

		if (filtered.length === 0 && isOfflineMode) {
			toast.error("Song not available offline");
			return;
		}

		addToQueue(song);
	};

	const addMultipleToQueueOfflineAware = (songs: DetailedSong[]) => {
		const filtered = songs;

		if (filtered.length === 0 && isOfflineMode) {
			toast.error("No songs available offline");
			return;
		}

		if (filtered.length < songs.length && isOfflineMode) {
			toast.info(
				`Added ${filtered.length} of ${songs.length} songs (offline mode)`,
			);
		}

		addMultipleToQueue(filtered);
	};

	return {
		...otherActions,
		playSong: playSongOfflineAware,
		playQueue: playQueueOfflineAware,
		addToQueue: addToQueueOfflineAware,
		addMultipleToQueue: addMultipleToQueueOfflineAware,
		playSongUnfiltered: playSong,
		playQueueUnfiltered: playQueue,
		addToQueueUnfiltered: addToQueue,
		addMultipleToQueueUnfiltered: addMultipleToQueue,
	};
}
