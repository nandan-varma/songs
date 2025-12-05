import { toast } from "sonner";
import { useOffline } from "@/contexts/offline-context";
import { usePlayerActions } from "@/contexts/player-context";
import type { DetailedSong } from "@/lib/types";

/**
 * Offline-aware player actions that automatically filter songs based on offline mode
 */
export function useOfflinePlayerActions() {
	const { getFilteredSongs, isOfflineMode } = useOffline();
	const {
		playQueue,
		addToQueue,
		addMultipleToQueue,
		playSong,
		...otherActions
	} = usePlayerActions();

	const playSongOfflineAware = (song: DetailedSong, replaceQueue = true) => {
		const filteredSongs = getFilteredSongs([song]);

		if (filteredSongs.length === 0 && isOfflineMode) {
			toast.error("Song not available offline");
			return;
		}

		playSong(song, replaceQueue);
	};

	const playQueueOfflineAware = (songs: DetailedSong[], startIndex = 0) => {
		const filteredSongs = getFilteredSongs(songs);

		if (filteredSongs.length === 0) {
			if (isOfflineMode) {
				toast.error("No cached songs available for offline playback");
			}
			return;
		}

		if (filteredSongs.length < songs.length && isOfflineMode) {
			toast.info(
				`Playing ${filteredSongs.length} of ${songs.length} songs (offline mode)`,
			);
		}

		const validStartIndex = Math.min(startIndex, filteredSongs.length - 1);
		playQueue(filteredSongs, validStartIndex);
	};

	const addToQueueOfflineAware = (song: DetailedSong) => {
		const filteredSongs = getFilteredSongs([song]);

		if (filteredSongs.length === 0 && isOfflineMode) {
			toast.error("Song not available offline");
			return;
		}

		addToQueue(song);
	};

	const addMultipleToQueueOfflineAware = (songs: DetailedSong[]) => {
		const filteredSongs = getFilteredSongs(songs);

		if (filteredSongs.length === 0 && isOfflineMode) {
			toast.error("No songs available offline");
			return;
		}

		if (filteredSongs.length < songs.length && isOfflineMode) {
			toast.info(
				`Added ${filteredSongs.length} of ${songs.length} songs (offline mode)`,
			);
		}

		addMultipleToQueue(filteredSongs);
	};

	return {
		...otherActions,
		playSong: playSongOfflineAware,
		playQueue: playQueueOfflineAware,
		addToQueue: addToQueueOfflineAware,
		addMultipleToQueue: addMultipleToQueueOfflineAware,
		// Keep original functions available
		playSongUnfiltered: playSong,
		playQueueUnfiltered: playQueue,
		addToQueueUnfiltered: addToQueue,
		addMultipleToQueueUnfiltered: addMultipleToQueue,
	};
}
