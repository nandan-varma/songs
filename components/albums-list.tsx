'use client';

import { Album, EntityType } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Disc3 } from 'lucide-react';
import { ProgressiveImage } from './progressive-image';
import Link from 'next/link';
import { LoadMoreButton } from './load-more-button';

interface AlbumsListProps {
  albums: Album[];
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
  totalCount?: number;
  hasMore?: boolean;
}

export function AlbumsList({ 
  albums,
  showLoadMore = false,
  onLoadMore,
  isLoading = false,
  totalCount = 0,
  hasMore = false 
}: AlbumsListProps) {
  if (albums.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Albums</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {albums.map((album) => (
          <Link key={album.id} href={`/albums/${album.id}`}>
            <Card className="overflow-hidden hover:bg-accent/50 transition-colors">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="relative aspect-square w-full">
                    {album.image && album.image.length > 0 ? (
                      <ProgressiveImage
                        images={album.image}
                        alt={album.title}
                        entityType={EntityType.ALBUM}
                        rounded="default"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted rounded">
                        <Disc3 className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium truncate">{album.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {album.artist}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {album.year} · {album.language}
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
          currentCount={albums.length}
          totalCount={totalCount}
          hasMore={hasMore}
        />
      )}
    </div>
  );
}
