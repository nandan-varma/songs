"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlbumsList } from "@/components/albums-list";
import { ArtistsList } from "@/components/artists-list";
import { SearchBar } from "@/components/common/search-bar";
import { HistoryList } from "@/components/history-list";
import { PlaylistsList } from "@/components/playlists-list";
import { GlobalSearchResults } from "@/components/search/global-search-results";
import { ErrorState, LoadingSpinner } from "@/components/search/search-states";
import { SearchTabContent } from "@/components/search/search-tab-content";
import { SongsList } from "@/components/songs-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHistory } from "@/contexts/history-context";
import { useOffline } from "@/hooks/cache";
import { useGlobalSearch } from "@/hooks/data/queries";
import { useSearchQueries } from "@/hooks/data/use-search-queries";
import { detailedSongToSong } from "@/lib/utils";
import type {
	Artist,
	ArtistSearchResult,
	Playlist,
	PlaylistSearchResult,
} from "@/types/entity";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type TabType = "all" | "songs" | "albums" | "artists" | "playlists";

const TABS = [
	{ value: "all", label: "All" },
	{ value: "songs", label: "Songs" },
	{ value: "albums", label: "Albums" },
	{ value: "artists", label: "Artists" },
	{ value: "playlists", label: "Playlists" },
] as const;

const SEARCH_PAGE_SIZE = 20;

/** Convert artist search result to standard artist format */
const artistSearchResultToArtist = (artist: ArtistSearchResult): Artist => ({
	id: artist.id,
	title: artist.name,
	image: artist.image,
	type: artist.type,
	description: artist.role,
	position: undefined,
});

/** Convert playlist search result to standard playlist format */
const playlistSearchResultToPlaylist = (
	playlist: PlaylistSearchResult,
): Playlist => ({
	id: playlist.id,
	title: playlist.name,
	image: playlist.image,
	url: playlist.url,
	language: playlist.language,
	type: playlist.type,
	description: `${playlist.songCount} songs`,
});

export default function SearchContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const isOfflineMode = useOffline();
	const { history } = useHistory();
	const queryParam = searchParams.get("q") || "";
	const tabParam = (searchParams.get("tab") as TabType) || "all";

	const [query, setQuery] = useState(queryParam);
	const [activeTab, setActiveTab] = useState<TabType>(tabParam);

	const searchEnabled = !!queryParam.trim() && !isOfflineMode;

	// Fetch global search when viewing "all" tab
	const globalSearchQuery = useGlobalSearch(queryParam, {
		enabled: activeTab === "all" && searchEnabled,
	});

	// Fetch all entity types in parallel
	const searchResults = useSearchQueries(queryParam, {
		limit: SEARCH_PAGE_SIZE,
		enabled: searchEnabled,
	});

	const hasError =
		!!globalSearchQuery.error ||
		searchResults.songs.error ||
		searchResults.albums.error ||
		searchResults.artists.error ||
		searchResults.playlists.error;

	const handleSearch = useCallback(() => {
		if (!query.trim()) return;
		router.push(`/?q=${encodeURIComponent(query)}&tab=${activeTab}`);
	}, [query, activeTab, router]);

	const handleTabChange = useCallback(
		(tab: string) => {
			const newTab = tab as TabType;
			setActiveTab(newTab);
			if (queryParam) {
				router.push(`/?q=${encodeURIComponent(queryParam)}&tab=${newTab}`);
			}
		},
		[queryParam, router],
	);

	/** Update local state when URL params change */
	useEffect(() => {
		setActiveTab(tabParam);
	}, [tabParam]);

	useEffect(() => {
		setQuery(queryParam);
	}, [queryParam]);

	return (
		<div className="container mx-auto px-4 py-8 space-y-8">
			<div className="flex justify-center">
				<SearchBar value={query} onChange={setQuery} onSearch={handleSearch} />
			</div>

			{!queryParam && <HistoryList items={history} />}

			{hasError && <ErrorState />}

			{queryParam && !hasError && (
				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					className="w-full"
				>
					<TabsList className="grid w-full max-w-md mx-auto grid-cols-5">
						{TABS.map((tab) => (
							<TabsTrigger key={tab.value} value={tab.value}>
								{tab.label}
							</TabsTrigger>
						))}
					</TabsList>

					<TabsContent value="all" className="space-y-8 mt-6">
						{globalSearchQuery.isPending ? (
							<LoadingSpinner />
						) : globalSearchQuery.data ? (
							<GlobalSearchResults
								results={globalSearchQuery.data}
								query={queryParam}
							/>
						) : null}
					</TabsContent>

					<TabsContent value="songs" className="mt-6">
						<SearchTabContent
							type="songs"
							isLoading={
								searchResults.songs.isLoading &&
								searchResults.songs.results.length === 0
							}
							hasResults={searchResults.songs.results.length > 0}
							query={queryParam}
						>
							<SongsList
								songs={searchResults.songs.results.map(detailedSongToSong)}
							/>
						</SearchTabContent>
					</TabsContent>

					<TabsContent value="albums" className="mt-6">
						<SearchTabContent
							type="albums"
							isLoading={
								searchResults.albums.isLoading &&
								searchResults.albums.results.length === 0
							}
							hasResults={searchResults.albums.results.length > 0}
							query={queryParam}
						>
							<AlbumsList albums={searchResults.albums.results} />
						</SearchTabContent>
					</TabsContent>

					<TabsContent value="artists" className="mt-6">
						<SearchTabContent
							type="artists"
							isLoading={
								searchResults.artists.isLoading &&
								searchResults.artists.results.length === 0
							}
							hasResults={searchResults.artists.results.length > 0}
							query={queryParam}
						>
							<ArtistsList
								artists={searchResults.artists.results.map(
									artistSearchResultToArtist,
								)}
							/>
						</SearchTabContent>
					</TabsContent>

					<TabsContent value="playlists" className="mt-6">
						<SearchTabContent
							type="playlists"
							isLoading={
								searchResults.playlists.isLoading &&
								searchResults.playlists.results.length === 0
							}
							hasResults={searchResults.playlists.results.length > 0}
							query={queryParam}
						>
							<PlaylistsList
								playlists={searchResults.playlists.results.map(
									playlistSearchResultToPlaylist,
								)}
							/>
						</SearchTabContent>
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}
