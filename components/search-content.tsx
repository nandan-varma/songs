'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/search-bar';
import { SongsList } from '@/components/songs-list';
import { AlbumsList } from '@/components/albums-list';
import { ArtistsList } from '@/components/artists-list';
import { searchMusic } from '@/lib/api';
import { SearchResponse } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

export function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [query, setQuery] = useState(queryParam);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch search results when query parameter changes
  useEffect(() => {
    const performSearch = async () => {
      if (!queryParam.trim()) {
        setSearchResults(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await searchMusic(queryParam);
        setSearchResults(results);
      } catch (err) {
        setError('Failed to fetch search results. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [queryParam]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    // Update URL with query parameter
    router.push(`/?q=${encodeURIComponent(query)}`);
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

      {!queryParam && !isLoading && !error && (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Search for your favorite songs, albums, and artists
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center text-destructive py-8">
          {error}
        </div>
      )}

      {/* Search Results */}
      {searchResults && !isLoading && (
        <div className="space-y-8">
          {searchResults.data.songs.results.length > 0 && (
            <>
              <SongsList songs={searchResults.data.songs.results} />
              <Separator />
            </>
          )}

          {searchResults.data.albums.results.length > 0 && (
            <>
              <AlbumsList albums={searchResults.data.albums.results} />
              <Separator />
            </>
          )}

          {searchResults.data.artists.results.length > 0 && (
            <ArtistsList artists={searchResults.data.artists.results} />
          )}

          {searchResults.data.songs.results.length === 0 &&
            searchResults.data.albums.results.length === 0 &&
            searchResults.data.artists.results.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                No results found for &quot;{query}&quot;
              </div>
            )}
        </div>
      )}
    </div>
  );
}
