"use client";

import {
	keepPreviousData,
	useInfiniteQuery,
	useQuery,
} from "@tanstack/react-query";
import { DEFAULT_LANGUAGE } from "@/lib/languages";
import {
	type CardSearchKind,
	getLyrics,
	getSuggestions,
	getSyncedLyrics,
	getTrending,
	type Page,
	searchCards,
	searchOverview,
	searchSongs,
} from "./data";
import { uniqueById } from "./mappers";

export type { CardSearchKind } from "./data";

const SEARCH_DEBOUNCE_MS = 150;

function pause(ms: number, signal: AbortSignal) {
	return new Promise<void>((resolve, reject) => {
		const timer = setTimeout(resolve, ms);
		signal.addEventListener(
			"abort",
			() => {
				clearTimeout(timer);
				reject(signal.reason);
			},
			{ once: true },
		);
	});
}

async function debounced<T>(signal: AbortSignal, request: () => Promise<T>) {
	await pause(SEARCH_DEBOUNCE_MS, signal);
	return request();
}

export const useSearchOverview = (query: string) =>
	useQuery({
		queryKey: ["search", "all", query],
		queryFn: ({ signal }) =>
			debounced(signal, () => searchOverview(query, signal)),
		placeholderData: keepPreviousData,
	});

function useSearchPages<T extends { id: string }>(
	key: readonly string[],
	fetchPage: (page: number, signal: AbortSignal) => Promise<Page<T>>,
) {
	return useInfiniteQuery({
		queryKey: ["search", ...key],
		queryFn: ({ pageParam, signal }) =>
			debounced(signal, () => fetchPage(pageParam, signal)),
		initialPageParam: 0,
		getNextPageParam: (last, pages) =>
			last.hasMore ? pages.length : undefined,
		select: ({ pages }) => uniqueById(pages.flatMap((page) => page.items)),
		placeholderData: keepPreviousData,
	});
}

export const useSongSearch = (query: string) =>
	useSearchPages(["songs", query], (page, signal) =>
		searchSongs(query, page, signal),
	);

export const useCardSearch = (kind: CardSearchKind, query: string) =>
	useSearchPages([kind, query], (page, signal) =>
		searchCards(kind, query, page, signal),
	);

export const useTrending = () =>
	useQuery({
		queryKey: ["trending", DEFAULT_LANGUAGE],
		queryFn: () => getTrending(DEFAULT_LANGUAGE),
	});

export const useSuggestions = (songId: string) =>
	useQuery({
		queryKey: ["suggestions", songId],
		queryFn: () => getSuggestions(songId),
	});

export const useSyncedLyrics = (
	title: string,
	artist: string,
	duration: number,
) =>
	useQuery({
		queryKey: ["synced-lyrics", title, artist],
		queryFn: () => getSyncedLyrics(title, artist, duration),
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
	});

export const useLyrics = (lyricsId: string) =>
	useQuery({
		queryKey: ["lyrics", lyricsId],
		queryFn: () => getLyrics(lyricsId),
		retry: false,
	});
