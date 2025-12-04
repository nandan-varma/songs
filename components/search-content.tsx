'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/search-bar';
import { SongsList } from '@/components/songs-list';
import { AlbumsList } from '@/components/albums-list';
import { ArtistsList } from '@/components/artists-list';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaylistsList } from '@/components/playlists-list';
import { detailedSongToSong } from '@/lib/utils';
import { 
  useGlobalSearch, 
  useSearchSongs, 
  useSearchAlbums, 
  useSearchArtists, 
  useSearchPlaylists 
} from '@/hooks/queries';

type TabType = 'all' | 'songs' | 'albums' | 'artists' | 'playlists';

export function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const tabParam = (searchParams.get('tab') as TabType) || 'all';

  const [query, setQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<TabType>(tabParam);
  
  // Global search query
  const { data: globalSearchResults, isLoading: isLoadingGlobal, error: globalError } = useGlobalSearch(queryParam, {
    enabled: activeTab === 'all' && queryParam.trim().length > 0,
  });
  
  // Individual search queries with infinite scroll
  const songsQuery = useSearchSongs(queryParam, 20, {
    enabled: activeTab === 'songs' && queryParam.trim().length > 0,
  });
  
  const albumsQuery = useSearchAlbums(queryParam, 20, {
    enabled: activeTab === 'albums' && queryParam.trim().length > 0,
  });
  
  const artistsQuery = useSearchArtists(queryParam, 20, {
    enabled: activeTab === 'artists' && queryParam.trim().length > 0,
  });
  
  const playlistsQuery = useSearchPlaylists(queryParam, 20, {
    enabled: activeTab === 'playlists' && queryParam.trim().length > 0,
  });
  
  // Flatten infinite query data
  const songsData = songsQuery.data as { pages: Array<{ total: number; results: any[] }> } | undefined;
  const albumsData = albumsQuery.data as { pages: Array<{ total: number; results: any[] }> } | undefined;
  const artistsData = artistsQuery.data as { pages: Array<{ total: number; results: any[] }> } | undefined;
  const playlistsData = playlistsQuery.data as { pages: Array<{ total: number; results: any[] }> } | undefined;
  
  const allSongs = songsData?.pages.flatMap(page => page.results.map(detailedSongToSong)) ?? [];
  const allAlbums = albumsData?.pages.flatMap(page => page.results) ?? [];
  const allArtists = artistsData?.pages.flatMap(page => page.results) ?? [];
  const allPlaylists = playlistsData?.pages.flatMap(page => page.results) ?? [];
  
  const totalSongs = songsData?.pages[0]?.total ?? 0;
  const totalAlbums = albumsData?.pages[0]?.total ?? 0;
  const totalArtists = artistsData?.pages[0]?.total ?? 0;
  const totalPlaylists = playlistsData?.pages[0]?.total ?? 0;

  // Update URL when tab changes
  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  const handleSearch = () => {
    if (!query.trim()) return;
    router.push(`/?q=${encodeURIComponent(query)}&tab=${activeTab}`);
  };

  const handleTabChange = (tab: string) => {
    const newTab = tab as TabType;
    setActiveTab(newTab);
    if (queryParam) {
      router.push(`/?q=${encodeURIComponent(queryParam)}&tab=${newTab}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Search Bar */}
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

      {/* Error State */}
      {(globalError || songsQuery.error || albumsQuery.error || artistsQuery.error || playlistsQuery.error) && (
        <div className="text-center text-destructive py-8">
          Failed to load search results. Please try again.
        </div>
      )}

      {/* Search Results with Tabs */}
      {queryParam && (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="songs">Songs</TabsTrigger>
            <TabsTrigger value="albums">Albums</TabsTrigger>
            <TabsTrigger value="artists">Artists</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
          </TabsList>

          {/* All Tab */}
          <TabsContent value="all" className="space-y-8 mt-6">
            {isLoadingGlobal ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : globalSearchResults ? (
              <div className="space-y-8">
                {globalSearchResults.data.songs.results.length > 0 && (
                  <>
                    <SongsList songs={globalSearchResults.data.songs.results} />
                    <Separator />
                  </>
                )}
                {globalSearchResults.data.albums.results.length > 0 && (
                  <>
                    <AlbumsList albums={globalSearchResults.data.albums.results} />
                    <Separator />
                  </>
                )}
                {globalSearchResults.data.artists.results.length > 0 && (
                  <>
                    <ArtistsList artists={globalSearchResults.data.artists.results} />
                    <Separator />
                  </>
                )}
                {globalSearchResults.data.playlists?.results.length > 0 && (
                  <PlaylistsList playlists={globalSearchResults.data.playlists.results} />
                )}
                {globalSearchResults.data.songs.results.length === 0 &&
                  globalSearchResults.data.albums.results.length === 0 &&
                  globalSearchResults.data.artists.results.length === 0 &&
                  (!globalSearchResults.data.playlists || globalSearchResults.data.playlists.results.length === 0) && (
                    <div className="text-center text-muted-foreground py-12">
                      No results found for &quot;{queryParam}&quot;
                    </div>
                  )}
              </div>
            ) : null}
          </TabsContent>

          {/* Songs Tab */}
          <TabsContent value="songs" className="mt-6">
            {songsQuery.isLoading && allSongs.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : allSongs.length > 0 ? (
              <SongsList 
                songs={allSongs}
                showLoadMore={true}
                onLoadMore={songsQuery.fetchNextPage}
                isLoading={songsQuery.isFetchingNextPage}
                totalCount={totalSongs}
                hasMore={songsQuery.hasNextPage ?? false}
              />
            ) : (
              <div className="text-center text-muted-foreground py-12">
                No songs found for &quot;{queryParam}&quot;
              </div>
            )}
          </TabsContent>

          {/* Albums Tab */}
          <TabsContent value="albums" className="mt-6">
            {albumsQuery.isLoading && allAlbums.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : allAlbums.length > 0 ? (
              <AlbumsList 
                albums={allAlbums}
                showLoadMore={true}
                onLoadMore={albumsQuery.fetchNextPage}
                isLoading={albumsQuery.isFetchingNextPage}
                totalCount={totalAlbums}
                hasMore={albumsQuery.hasNextPage ?? false}
              />
            ) : (
              <div className="text-center text-muted-foreground py-12">
                No albums found for &quot;{queryParam}&quot;
              </div>
            )}
          </TabsContent>

          {/* Artists Tab */}
          <TabsContent value="artists" className="mt-6">
            {artistsQuery.isLoading && allArtists.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : allArtists.length > 0 ? (
              <ArtistsList 
                artists={allArtists}
                showLoadMore={true}
                onLoadMore={artistsQuery.fetchNextPage}
                isLoading={artistsQuery.isFetchingNextPage}
                totalCount={totalArtists}
                hasMore={artistsQuery.hasNextPage ?? false}
              />
            ) : (
              <div className="text-center text-muted-foreground py-12">
                No artists found for &quot;{queryParam}&quot;
              </div>
            )}
          </TabsContent>

          {/* Playlists Tab */}
          <TabsContent value="playlists" className="mt-6">
            {playlistsQuery.isLoading && allPlaylists.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : allPlaylists.length > 0 ? (
              <PlaylistsList 
                playlists={allPlaylists}
                showLoadMore={true}
                onLoadMore={playlistsQuery.fetchNextPage}
                isLoading={playlistsQuery.isFetchingNextPage}
                totalCount={totalPlaylists}
                hasMore={playlistsQuery.hasNextPage ?? false}
              />
            ) : (
              <div className="text-center text-muted-foreground py-12">
                No playlists found for &quot;{queryParam}&quot;
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
