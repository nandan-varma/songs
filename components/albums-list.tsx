'use client';

import { Album } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Disc3 } from 'lucide-react';
import Image from 'next/image';

interface AlbumsListProps {
  albums: Album[];
}

export function AlbumsList({ albums }: AlbumsListProps) {
  if (albums.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Albums</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {albums.map((album) => (
          <Card key={album.id} className="overflow-hidden hover:bg-accent/50 transition-colors">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="relative aspect-square w-full rounded overflow-hidden bg-muted">
                  {album.image?.[2]?.url ? (
                    <Image
                      src={album.image[2].url}
                      alt={album.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
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
        ))}
      </div>
    </div>
  );
}
