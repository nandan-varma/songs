'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/search-bar';
import { SongsList } from '@/components/songs-list';
import { AlbumsList } from '@/components/albums-list';
import { ArtistsList } from '@/components/artists-list';
import { PlaylistsList } from '@/components/playlists-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner, ErrorState } from '@/components/search/search-states';
import { SearchTabContent } from '@/components/search/search-tab-content';
import { GlobalSearchResults } from '@/components/search/global-search-results';
import { detailedSongToSong } from '@/lib/utils';
import { 
  DetailedSong, 
  Artist, 
  Playlist,
  AlbumSearchResult,
  ArtistSearchResult,
  PlaylistSearchResult 
} from '@/lib/types';
import { 
  useGlobalSearch, 
  useSearchSongs, 
  useSearchAlbums, 
  useSearchArtists, 
  useSearchPlaylists 
} from '@/hooks/queries';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type TabType = 'all' | 'songs' | 'albums' | 'artists' | 'playlists';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'songs', label: 'Songs' },
  { value: 'albums', label: 'Albums' },
  { value: 'artists', label: 'Artists' },
  { value: 'playlists', label: 'Playlists' },
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
const playlistSearchResultToPlaylist = (playlist: PlaylistSearchResult): Playlist => ({
  id: playlist.id,
  title: playlist.name,
  image: playlist.image,
  url: playlist.url,
  language: playlist.language,
  type: playlist.type,
  description: `${playlist.songCount} songs`,
});

export function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const tabParam = (searchParams.get('tab') as TabType) || 'all';

  const [query, setQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<TabType>(tabParam);
  
  const searchEnabled = useMemo(() => queryParam.trim().length > 0, [queryParam]);
  
  const globalSearchQuery = useGlobalSearch(queryParam, {
    enabled: activeTab === 'all' && searchEnabled,
  });
  
  const songsQuery = useSearchSongs(queryParam, SEARCH_PAGE_SIZE, {
    enabled: activeTab === 'songs' && searchEnabled,
  });
  
  const albumsQuery = useSearchAlbums(queryParam, SEARCH_PAGE_SIZE, {
    enabled: activeTab === 'albums' && searchEnabled,
  });
  
  const artistsQuery = useSearchArtists(queryParam, SEARCH_PAGE_SIZE, {
    enabled: activeTab === 'artists' && searchEnabled,
  });
  
  const playlistsQuery = useSearchPlaylists(queryParam, SEARCH_PAGE_SIZE, {
    enabled: activeTab === 'playlists' && searchEnabled,
  });

  /** Process infinite query data efficiently */
  const processedData = useMemo(() => {
    const songsData = songsQuery.data as { pages: Array<{ total: number; results: DetailedSong[] }> } | undefined;
    const albumsData = albumsQuery.data as { pages: Array<{ total: number; results: AlbumSearchResult[] }> } | undefined;
    const artistsData = artistsQuery.data as { pages: Array<{ total: number; results: ArtistSearchResult[] }> } | undefined;
    const playlistsData = playlistsQuery.data as { pages: Array<{ total: number; results: PlaylistSearchResult[] }> } | undefined;
    
    return {
      songs: {
        items: songsData?.pages.flatMap(page => page.results.map(detailedSongToSong)) ?? [],
        total: songsData?.pages[0]?.total ?? 0,
      },
      albums: {
        items: albumsData?.pages.flatMap(page => page.results) ?? [],
        total: albumsData?.pages[0]?.total ?? 0,
      },
      artists: {
        items: artistsData?.pages.flatMap(page => page.results.map(artistSearchResultToArtist)) ?? [],
        total: artistsData?.pages[0]?.total ?? 0,
      },
      playlists: {
        items: playlistsData?.pages.flatMap(page => page.results.map(playlistSearchResultToPlaylist)) ?? [],
        total: playlistsData?.pages[0]?.total ?? 0,
      },
    };
  }, [songsQuery.data, albumsQuery.data, artistsQuery.data, playlistsQuery.data]);

  const hasError = useMemo(() => {
    return !!(globalSearchQuery.error || songsQuery.error || albumsQuery.error || 
              artistsQuery.error || playlistsQuery.error);
  }, [globalSearchQuery.error, songsQuery.error, albumsQuery.error, 
      artistsQuery.error, playlistsQuery.error]);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    router.push(`/?q=${encodeURIComponent(query)}&tab=${activeTab}`);
  }, [query, activeTab, router]);

  const handleTabChange = useCallback((tab: string) => {
    const newTab = tab as TabType;
    setActiveTab(newTab);
    if (queryParam) {
      router.push(`/?q=${encodeURIComponent(queryParam)}&tab=${newTab}`);
    }
  }, [queryParam, router]);

  const loadMoreCallbacks = useMemo(() => ({
    songs: songsQuery.fetchNextPage,
    albums: albumsQuery.fetchNextPage,
    artists: artistsQuery.fetchNextPage,
    playlists: playlistsQuery.fetchNextPage,
  }), [songsQuery.fetchNextPage, albumsQuery.fetchNextPage, 
       artistsQuery.fetchNextPage, playlistsQuery.fetchNextPage]);

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
        <SearchBar
          value={query}
          onChange={setQuery}
          onSearch={handleSearch}
        />
      </div>

      {!queryParam && (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Search for your favorite songs, albums, and artists
          </p>
        </div>
      )}

      {hasError && <ErrorState />}

      {queryParam && !hasError && (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-5">
            {TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-8 mt-6">
            {globalSearchQuery.isLoading ? (
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
              isLoading={songsQuery.isLoading && processedData.songs.items.length === 0}
              hasResults={processedData.songs.items.length > 0}
              query={queryParam}
            >
              <SongsList 
                songs={processedData.songs.items}
                showLoadMore={true}
                onLoadMore={loadMoreCallbacks.songs}
                isLoading={songsQuery.isFetchingNextPage}
                totalCount={processedData.songs.total}
                hasMore={songsQuery.hasNextPage ?? false}
              />
            </SearchTabContent>
          </TabsContent>

          <TabsContent value="albums" className="mt-6">
            <SearchTabContent
              type="albums"
              isLoading={albumsQuery.isLoading && processedData.albums.items.length === 0}
              hasResults={processedData.albums.items.length > 0}
              query={queryParam}
            >
              <AlbumsList 
                albums={processedData.albums.items}
                showLoadMore={true}
                onLoadMore={loadMoreCallbacks.albums}
                isLoading={albumsQuery.isFetchingNextPage}
                totalCount={processedData.albums.total}
                hasMore={albumsQuery.hasNextPage ?? false}
              />
            </SearchTabContent>
          </TabsContent>

          <TabsContent value="artists" className="mt-6">
            <SearchTabContent
              type="artists"
              isLoading={artistsQuery.isLoading && processedData.artists.items.length === 0}
              hasResults={processedData.artists.items.length > 0}
              query={queryParam}
            >
              <ArtistsList 
                artists={processedData.artists.items}
                showLoadMore={true}
                onLoadMore={loadMoreCallbacks.artists}
                isLoading={artistsQuery.isFetchingNextPage}
                totalCount={processedData.artists.total}
                hasMore={artistsQuery.hasNextPage ?? false}
              />
            </SearchTabContent>
          </TabsContent>

          <TabsContent value="playlists" className="mt-6">
            <SearchTabContent
              type="playlists"
              isLoading={playlistsQuery.isLoading && processedData.playlists.items.length === 0}
              hasResults={processedData.playlists.items.length > 0}
              query={queryParam}
            >
              <PlaylistsList 
                playlists={processedData.playlists.items}
                showLoadMore={true}
                onLoadMore={loadMoreCallbacks.playlists}
                isLoading={playlistsQuery.isFetchingNextPage}
                totalCount={processedData.playlists.total}
                hasMore={playlistsQuery.hasNextPage ?? false}
              />
            </SearchTabContent>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
