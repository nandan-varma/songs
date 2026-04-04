/**
 * Song Actions Hook
 * Centralizes song action logic (queue, playlist, favorites)
 * Replaces: song-action-menu.tsx pattern (~50 LOC)
 */

import { useCallback } from "react";
import { useFavorites } from "@/contexts/favorites-context";
import { useLocalPlaylists } from "@/contexts/local-playlists-context";
import { useQueueActions } from "@/contexts/queue-context";
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
	const { isFavorite, toggleFavorite } = useFavorites();
	const { addSong, insertSongAt } = useQueueActions();
	const { playlists, addSongToPlaylist } = useLocalPlaylists();

	const handlePlay = useCallback(
		(_song: DetailedSong, onPlay?: () => void) => {
			onPlay?.();
			options?.onSongAdded?.();
		},
		[options],
	);

	const handlePlayNext = useCallback(
		(song: DetailedSong) => {
			insertSongAt(song, 1);
			options?.onSongAdded?.();
		},
		[insertSongAt, options],
	);

	const handleAddToQueue = useCallback(
		(song: DetailedSong) => {
			addSong(song);
			options?.onSongAdded?.();
		},
		[addSong, options],
	);

	const handleToggleFavorite = useCallback(
		(song: DetailedSong) => {
			toggleFavorite(song);
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
