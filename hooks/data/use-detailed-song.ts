/**
 * Lazy Load Detailed Song Hook
 * Fetches full song details when needed (e.g., in action menus)
 * Replaces: song-action-menu.tsx lines 50-63
 */

import type { UseQueryOptions } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getSongById } from "@/lib/api";
import { CACHE_KEYS, CACHE_TIMES } from "@/lib/cache";
import type { DetailedSong } from "@/types/api";

export interface UseDetailedSongOptions
	extends Omit<UseQueryOptions<DetailedSong[]>, "queryKey" | "queryFn"> {
	/** Enable/disable the query */
	enabled?: boolean;
}

/**
 * Hook to lazily fetch detailed song information
 * Used when you need full song details but don't have them upfront
 *
 * @param songId - Song ID to fetch details for
 * @param options - Query options
 * @returns Query result with song details array
 *
 * @example
 * const { data: songs, isLoading } = useDetailedSong(songId);
 * const song = songs?.[0];
 */
export function useDetailedSong(
	songId: string | null,
	options?: UseDetailedSongOptions,
) {
	return useQuery({
		queryKey: CACHE_KEYS.SONGS(songId || ""),
		queryFn: async () => {
			if (!songId) throw new Error("Song ID required");
			return getSongById(songId);
		},
		enabled: !!songId && options?.enabled !== false,
		staleTime: CACHE_TIMES.SONG,
		...options,
	});
}
