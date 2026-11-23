import { toast } from "sonner";
import type { DetailedSong } from "@/types/entity";

export function showDownloadError(songName: string): void {
	toast.error(`Failed to download ${songName}`);
}

export function showDownloadSuccess(songName: string): void {
	toast.success(`Downloaded: ${songName}`);
}

export function showAlreadyDownloaded(): void {
	toast.info("Song is already downloaded");
}

export function showOfflineSongUnavailable(): void {
	toast.error("Song not available offline");
}

export function showOfflinePartialQueue(
	songCount: number,
	total: number,
): void {
	toast.info(`Playing ${songCount} of ${total} songs (offline mode)`);
}

export function showNoCachedSongsForOffline(): void {
	toast.error("No cached songs available for offline playback");
}

export function showNoSongsAvailableOffline(): void {
	toast.error("No songs available offline");
}

export function showSongAddedToQueue(song: DetailedSong): void {
	toast.success(`Playing "${song.name}" next`);
}

export function showSongAlreadyInQueue(songName: string): void {
	toast.info(`"${songName}" is already in queue`);
}

export function showAllSongsAlreadyInQueue(): void {
	toast.info("All songs are already in queue");
}

export function showDuplicatesSkipped(count: number): void {
	toast.info(`Skipped ${count} duplicate song${count > 1 ? "s" : ""}`);
}

export function showAddedToPlaylist(
	songName: string,
	playlistName: string,
): void {
	toast.success(`Added "${songName}" to "${playlistName}"`);
}

export function showRemovedFromPlaylist(
	songName: string,
	playlistName: string,
): void {
	toast.success(`Removed "${songName}" from "${playlistName}"`);
}

export function showPlaylistCreated(name: string): void {
	toast.success(`Created playlist "${name}"`);
}

export function showPlaylistDeleted(name: string): void {
	toast.success(`Deleted playlist "${name}"`);
}

export function showFavoriteAdded(songName: string): void {
	toast.success(`Added "${songName}" to favorites`);
}

export function showFavoriteRemoved(songName: string): void {
	toast.success(`Removed "${songName}" from favorites`);
}

export function showFavoritesCleared(): void {
	toast.success("Cleared all favorites");
}

export function showBackOnline(): void {
	toast.success("Back online");
}

export function showUpdateAvailable(): void {
	toast.info("Update Available");
}

export function showOfflineModeActive(): void {
	toast.error("Offline Mode Active");
}
