"use client";

import { useQueryState } from "nuqs";
import { EntityGrid } from "@/components/common/entity-grid";
import { LoadMoreButton } from "@/components/common/load-more-button";
import { DiscoverContent } from "@/components/discover/discover-content";
import { HistoryList } from "@/components/history-list";
import { ErrorState } from "@/components/search/search-states";
import { SearchTabContent } from "@/components/search/search-tab-content";
import { SongsList } from "@/components/songs-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchQueries } from "@/hooks/data/use-search-queries";
import { useIsOffline } from "@/hooks/network/use-is-offline";
import { useHistory } from "@/hooks/use-store";
import {
	albumToItem,
	artistToItem,
	playlistToItem,
} from "@/lib/utils/entity-items";

const TABS = [
	{ value: "all", label: "All" },
	{ value: "songs", label: "Songs" },
	{ value: "albums", label: "Albums" },
	{ value: "artists", label: "Artists" },
	{ value: "playlists", label: "Playlists" },
] as const;

type TabType = (typeof TABS)[number]["value"];

const SEARCH_PAGE_SIZE = 20;
const ALL_TAB_SONGS = 5;

/** Search results (or the discover home when there is no query); the query itself is typed in the navbar. */
export default function SearchContent() {
	const [query] = useQueryState("q", { defaultValue: "" });
	const [tabParam, setTabParam] = useQueryState("tab");
	const isOffline = useIsOffline();
	const { playbackHistory } = useHistory();

	const activeTab = (tabParam as TabType | null) ?? "all";
	const results = useSearchQueries(query, {
		limit: SEARCH_PAGE_SIZE,
		enabled: !!query.trim() && !isOffline,
	});
	const { songs, albums, artists, playlists } = results;

	if (!query) {
		return (
			<div className="container mx-auto space-y-6 px-4 py-4 md:space-y-8 md:py-8">
				<DiscoverContent />
				<HistoryList items={playbackHistory} />
			</div>
		);
	}

	if (results.isError) {
		return (
			<div className="container mx-auto px-4 py-8">
				<ErrorState />
			</div>
		);
	}

	const albumItems = albums.results.map(albumToItem);
	const artistItems = artists.results.map(artistToItem);
	const playlistItems = playlists.results.map(playlistToItem);

	return (
		<div className="container mx-auto px-4 py-4 md:py-8">
			<Tabs
				value={activeTab}
				onValueChange={(tab) => void setTabParam(tab)}
				className="w-full"
			>
				<TabsList className="mx-auto grid w-full max-w-md grid-cols-5">
					{TABS.map((tab) => (
						<TabsTrigger
							key={tab.value}
							value={tab.value}
							className="px-1 text-xs md:px-3 md:text-sm"
						>
							{tab.label}
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent
					value="all"
					className="mt-4 space-y-6 md:mt-6 md:space-y-8"
				>
					<SearchTabContent
						type="results"
						isLoading={results.isLoading}
						hasResults={
							songs.results.length +
								albumItems.length +
								artistItems.length +
								playlistItems.length >
							0
						}
						query={query}
					>
						<SongsList songs={songs.results.slice(0, ALL_TAB_SONGS)} />
						<EntityGrid shelf kind="album" title="Albums" items={albumItems} />
						<EntityGrid
							shelf
							kind="artist"
							title="Artists"
							items={artistItems}
						/>
						<EntityGrid
							shelf
							kind="playlist"
							title="Playlists"
							items={playlistItems}
						/>
					</SearchTabContent>
				</TabsContent>

				<TabsContent value="songs" className="mt-4 md:mt-6">
					<SearchTabContent
						type="songs"
						isLoading={songs.isLoading}
						hasResults={songs.results.length > 0}
						query={query}
					>
						<SongsList songs={songs.results} />
						<LoadMoreButton
							hasNextPage={songs.hasNextPage}
							isFetching={songs.isFetchingNextPage}
							onLoadMore={songs.fetchNextPage}
						/>
					</SearchTabContent>
				</TabsContent>

				{(
					[
						["albums", "album", albums, albumItems],
						["artists", "artist", artists, artistItems],
						["playlists", "playlist", playlists, playlistItems],
					] as const
				).map(([tab, kind, section, items]) => (
					<TabsContent key={tab} value={tab} className="mt-4 md:mt-6">
						<SearchTabContent
							type={tab}
							isLoading={section.isLoading}
							hasResults={items.length > 0}
							query={query}
						>
							<EntityGrid kind={kind} title={tab} items={items} />
							<LoadMoreButton
								hasNextPage={section.hasNextPage}
								isFetching={section.isFetchingNextPage}
								onLoadMore={section.fetchNextPage}
							/>
						</SearchTabContent>
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}
