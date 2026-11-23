"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
	DOWNLOADED_SONGS_QUERY_KEY,
	getDownloadedSong,
	removeDownloadedSong,
	saveDownloadedSong,
} from "@/lib/downloads/storage";
import { useAppStore } from "@/lib/store";
import { getDownloadUrl } from "@/lib/utils/download";
import { logError } from "@/lib/utils/logger";
import type { DetailedSong } from "@/types/entity";

export function useDownloadSong() {
	const queryClient = useQueryClient();
	const addDownloadedSong = useAppStore((state) => state.addDownloadedSong);
	const removeDownloadedSongId = useAppStore(
		(state) => state.removeDownloadedSong,
	);

	const isSongCached = useCallback(async (songId: string): Promise<boolean> => {
		try {
			return (await getDownloadedSong(songId)) !== null;
		} catch (error) {
			logError("CheckCachedSong", error);
			return false;
		}
	}, []);

	const downloadMutation = useMutation({
		mutationFn: async (song: DetailedSong) => {
			try {
				const downloadUrl = getDownloadUrl(song, "320kbps");

				if (!downloadUrl) {
					throw new Error("No download URL available for song");
				}

				const response = await fetch(downloadUrl);
				if (!response.ok) {
					throw new Error(`Download failed: HTTP ${response.status}`);
				}

				const blob = await response.blob();
				await saveDownloadedSong(song, blob);

				return song;
			} catch (error) {
				logError("DownloadSong", error);
				throw error;
			}
		},
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		onSuccess: (song) => {
			addDownloadedSong(song.id);
			void queryClient.invalidateQueries({
				queryKey: DOWNLOADED_SONGS_QUERY_KEY,
			});
		},
	});

	const removeMutation = useMutation({
		mutationFn: async (songId: string) => {
			try {
				await removeDownloadedSong(songId);
			} catch (error) {
				logError("RemoveDownloadedSong", error);
				throw error;
			}
		},
		onSuccess: (_data, songId) => {
			removeDownloadedSongId(songId);
			void queryClient.invalidateQueries({
				queryKey: DOWNLOADED_SONGS_QUERY_KEY,
			});
		},
	});

	return {
		downloadSong: downloadMutation.mutate,
		isDownloading: downloadMutation.isPending,
		error: downloadMutation.error,
		isSongCached,
		removeSong: removeMutation.mutate,
		isRemoving: removeMutation.isPending,
	};
}
