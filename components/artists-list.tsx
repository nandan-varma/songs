'use client';

import { Artist } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { LoadMoreButton } from './load-more-button';

interface ArtistsListProps {
  artists: Artist[];
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
  totalCount?: number;
  hasMore?: boolean;
}

export function ArtistsList({ 
  artists,
  showLoadMore = false,
  onLoadMore,
  isLoading = false,
  totalCount = 0,
  hasMore = false 
}: ArtistsListProps) {
  if (artists.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Artists</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {artists.map((artist) => (
          <Link key={artist.id} href={`/artists/${artist.id}`}>
            <Card className="overflow-hidden hover:bg-accent/50 transition-colors">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="relative aspect-square w-full rounded-full overflow-hidden bg-muted">
                    {artist.image?.[2]?.url ? (
                      <Image
                        src={artist.image[2].url}
                        alt={artist.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium truncate">{artist.title}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {artist.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {showLoadMore && onLoadMore && (
        <LoadMoreButton
          onLoadMore={onLoadMore}
          isLoading={isLoading}
          currentCount={artists.length}
          totalCount={totalCount}
          hasMore={hasMore}
        />
      )}
    </div>
  );
}
