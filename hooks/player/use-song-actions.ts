/**
 * Song Actions Hook
 * Centralizes song action logic (queue, playlist, favorites)
 */

import { useCallback } from "react";
import { useAppStore, useFavorites, usePlaylists } from "@/hooks/use-store";
import type { DetailedSong } from "@/types/entity";

export interface UseSongActionsOptions {
	/** Called when playlist is created */
	onPlaylistCreated?: () => void;
	/** Called when song is added */
	onSongAdded?: () => void;
}

/**
 * Hook for managing song actions
 * Combines favorites, queue, and playlist operations into a single interface
 *
 * @example
 * const { toggleFavorite, addToQueue, isFavorite, addToPlaylist } =
 *   useSongActions({ onSongAdded: () => toast.success("Added!") });
 */
export function useSongActions(options?: UseSongActionsOptions) {
	const { toggleFavorite, isFavorite } = useFavorites();
	const { playlists, addSongToPlaylist } = usePlaylists();

	const handlePlay = useCallback(
		(_song: DetailedSong, onPlay?: () => void) => {
			onPlay?.();
			options?.onSongAdded?.();
		},
		[options],
	);

	const handlePlayNext = useCallback(
		(song: DetailedSong) => {
			useAppStore.getState().insertSongNext(song);
			options?.onSongAdded?.();
		},
		[options],
	);

	const handleAddToQueue = useCallback(
		(song: DetailedSong) => {
			const { addSongToQueue } = useAppStore.getState();
			addSongToQueue(song);
			options?.onSongAdded?.();
		},
		[options],
	);

	const handleToggleFavorite = useCallback(
		(songId: string) => {
			toggleFavorite(songId);
		},
		[toggleFavorite],
	);

	const handleAddToPlaylist = useCallback(
		(playlistId: string, song: DetailedSong) => {
			addSongToPlaylist(playlistId, song);
			options?.onSongAdded?.();
		},
		[addSongToPlaylist, options],
	);

	return {
		// Actions
		handlePlay,
		handlePlayNext,
		handleAddToQueue,
		handleToggleFavorite,
		handleAddToPlaylist,

		// State
		playlists,
		isFavorite,
	};
}
