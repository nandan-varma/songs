'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/search-bar';
import { SongsList } from '@/components/songs-list';
import { AlbumsList } from '@/components/albums-list';
import { ArtistsList } from '@/components/artists-list';
import { searchMusic } from '@/lib/api';
import { SearchResponse } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchMusic(query);
      setSearchResults(results);
    } catch (err) {
      setError('Failed to fetch search results. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Music Search</h1>
          <p className="text-muted-foreground">
            Search for your favorite songs, albums, and artists
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex justify-center">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSearch={handleSearch}
          />
        </div>

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
    </div>
  );
}
