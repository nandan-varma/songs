"use client";

import { useQuery } from "@tanstack/react-query";
import {
	DOWNLOADED_SONGS_QUERY_KEY,
	listDownloadedSongs,
} from "@/lib/downloads/storage";
import { useAppStore } from "@/lib/store";

export function useCachedSongs() {
	const syncDownloadedSongs = useAppStore((state) => state.syncDownloadedSongs);

	const query = useQuery({
		queryKey: DOWNLOADED_SONGS_QUERY_KEY,
		queryFn: async () => {
			const downloads = await listDownloadedSongs();
			syncDownloadedSongs(downloads.map((download) => download.song.id));
			return downloads.map((download) => download.song);
		},
		staleTime: 1000 * 60,
	});

	return {
		cachedSongs: query.data ?? [],
		isLoading: query.isPending,
		error: query.error,
		count: query.data?.length ?? 0,
	};
}
