import { toast } from "sonner";
import { useIsOffline } from "@/hooks/network/use-is-offline";
import { useAppStore } from "@/hooks/use-store";
import type { DetailedSong } from "@/types/entity";

export function useOfflinePlayerActions() {
	const isOffline = useIsOffline();
	const downloadedSongIds = useAppStore((state) => state.downloadedSongIds);

	const filterOfflineSongs = (songs: DetailedSong[]) => {
		if (!isOffline) {
			return songs;
		}

		return songs.filter((song) => downloadedSongIds.has(song.id));
	};

	const playSongOfflineAware = (song: DetailedSong, replaceQueue = true) => {
		const filtered = filterOfflineSongs([song]);

		if (filtered.length === 0) {
			toast.error("Song not available offline");
			return;
		}

		const { playSong, addToPlaybackHistory } = useAppStore.getState();
		playSong(filtered[0] as DetailedSong, replaceQueue);
		addToPlaybackHistory(filtered[0] as DetailedSong);
	};

	const playQueueOfflineAware = (songs: DetailedSong[], startIndex = 0) => {
		const filtered = filterOfflineSongs(songs);

		if (filtered.length === 0) {
			if (isOffline) {
				toast.error("No cached songs available for offline playback");
			}
			return;
		}

		if (filtered.length < songs.length && isOffline) {
			toast.info(
				`Playing ${filtered.length} of ${songs.length} downloaded songs`,
			);
		}

		const validStartIndex = Math.min(startIndex, filtered.length - 1);
		const { playQueue } = useAppStore.getState();
		playQueue(filtered, validStartIndex);
	};

	const addToQueueOfflineAware = (song: DetailedSong) => {
		const filtered = filterOfflineSongs([song]);

		if (filtered.length === 0) {
			toast.error("Song not available offline");
			return;
		}

		const { addSongToQueue } = useAppStore.getState();
		addSongToQueue(filtered[0] as DetailedSong);
	};

	const addMultipleToQueueOfflineAware = (songs: DetailedSong[]) => {
		const filtered = filterOfflineSongs(songs);

		if (filtered.length === 0) {
			toast.error("No songs available offline");
			return;
		}

		if (filtered.length < songs.length && isOffline) {
			toast.info(
				`Added ${filtered.length} of ${songs.length} downloaded songs`,
			);
		}

		const { addSongsToQueue } = useAppStore.getState();
		addSongsToQueue(filtered);
	};

	return {
		playSong: playSongOfflineAware,
		playQueue: playQueueOfflineAware,
		addToQueue: addToQueueOfflineAware,
		addMultipleToQueue: addMultipleToQueueOfflineAware,
	};
}
