'use client';

import { Song } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Music } from 'lucide-react';
import Image from 'next/image';

interface SongsListProps {
  songs: Song[];
}

export function SongsList({ songs }: SongsListProps) {
  if (songs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Songs</h2>
      <div className="grid gap-3">
        {songs.map((song) => (
          <Card key={song.id} className="overflow-hidden hover:bg-accent/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                  {song.image?.[2]?.url ? (
                    <Image
                      src={song.image[2].url}
                      alt={song.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Music className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{song.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {song.primaryArtists}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {song.album}
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
