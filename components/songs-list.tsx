'use client';

import { Song } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Music, Play, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePlayer } from '@/contexts/player-context';
import { convertToDetailedSong } from '@/lib/utils';
import { toast } from 'sonner';

interface SongsListProps {
  songs: Song[];
}

export function SongsList({ songs }: SongsListProps) {
  const { playSong, addToQueue } = usePlayer();

  if (songs.length === 0) {
    return null;
  }

  const handlePlay = (song: Song, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playSong(convertToDetailedSong(song));
    toast.success(`Now playing: ${song.title}`);
  };

  const handleAddToQueue = (song: Song, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToQueue(convertToDetailedSong(song));
    toast.success(`Added to queue: ${song.title}`);
  };

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
                  <Link href={`/songs/${song.id}`}>
                    <h3 className="font-medium truncate hover:underline">{song.title}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground truncate">
                    {song.primaryArtists}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {song.album}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => handlePlay(song, e)}
                    aria-label="Play song"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => handleAddToQueue(song, e)}
                    aria-label="Add to queue"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
