"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
	type CardSearchKind,
	getLyrics,
	getSuggestions,
	type Page,
	searchCards,
	searchSongs,
} from "./data";

export type { CardSearchKind, SearchKind } from "./data";

function useSearchPages<T>(
	key: readonly unknown[],
	fetchPage: (page: number) => Promise<Page<T>>,
	enabled: boolean,
) {
	return useInfiniteQuery({
		queryKey: ["search", ...key],
		queryFn: ({ pageParam }) => fetchPage(pageParam),
		initialPageParam: 0,
		getNextPageParam: (last, pages) =>
			last.hasMore ? pages.length : undefined,
		select: ({ pages }) => pages.flatMap((page) => page.items),
		enabled,
	});
}

export const useSongSearch = (query: string) =>
	useSearchPages(["songs", query], (page) => searchSongs(query, page), true);

export const useCardSearch = (kind: CardSearchKind, query: string) =>
	useSearchPages([kind, query], (page) => searchCards(kind, query, page), true);

export const useSuggestions = (songId: string) =>
	useQuery({
		queryKey: ["suggestions", songId],
		queryFn: () => getSuggestions(songId),
	});

export const useLyrics = (lyricsId: string) =>
	useQuery({
		queryKey: ["lyrics", lyricsId],
		queryFn: () => getLyrics(lyricsId),
		retry: false,
	});
