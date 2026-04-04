"use client";

import { useQueryState } from "nuqs";
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
import { useGlobalSearch } from "@/hooks/data/queries";
import { useSearchQueries } from "@/hooks/data/use-search-queries";
import { useIsOffline } from "@/hooks/network/use-is-offline";
import { useHistory } from "@/hooks/use-store";
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
	const [queryParam, setQueryParam] = useQueryState("q");
	const [tabParam, setTabParam] = useQueryState("tab");
	const isOffline = useIsOffline();
	const { playbackHistory } = useHistory();

	const query = queryParam ?? "";
	const activeTab = (tabParam as TabType | null) ?? "all";
	const [draftQuery, setDraftQuery] = useState(query);

	const searchEnabled = !!query.trim() && !isOffline;

	// Fetch global search when viewing "all" tab
	const globalSearchQuery = useGlobalSearch(query, {
		enabled: activeTab === "all" && searchEnabled,
	});

	// Fetch all entity types in parallel
	const searchResults = useSearchQueries(query, {
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
		const nextQuery = draftQuery.trim();
		void setQueryParam(nextQuery ? nextQuery : null);
		if (!tabParam) {
			void setTabParam(activeTab);
		}
	}, [activeTab, draftQuery, setQueryParam, setTabParam, tabParam]);

	const handleTabChange = useCallback(
		(tab: string) => {
			void setTabParam(tab as TabType);
		},
		[setTabParam],
	);

	useEffect(() => {
		setDraftQuery(query);
	}, [query]);

	return (
		<div className="container mx-auto px-4 py-8 space-y-8">
			<div className="flex justify-center">
				<SearchBar
					value={draftQuery}
					onChange={setDraftQuery}
					onSearch={handleSearch}
				/>
			</div>

			{!query && <HistoryList items={playbackHistory} />}

			{hasError && <ErrorState />}

			{query && !hasError && (
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
								query={query}
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
							query={query}
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
							query={query}
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
							query={query}
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
							query={query}
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
