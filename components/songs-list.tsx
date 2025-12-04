'use client';

import { Song, EntityType } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Music, Play, Plus } from 'lucide-react';
import { ProgressiveImage } from './progressive-image';
import Link from 'next/link';
import { usePlayer } from '@/contexts/player-context';
import { getSongById } from '@/lib/api';
import { toast } from 'sonner';
import { LoadMoreButton } from './load-more-button';

interface SongsListProps {
  songs: Song[];
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
  totalCount?: number;
  hasMore?: boolean;
}

export function SongsList({ 
  songs, 
  showLoadMore = false,
  onLoadMore,
  isLoading = false,
  totalCount = 0,
  hasMore = false 
}: SongsListProps) {
  const { playSong, addToQueue } = usePlayer();

  if (songs.length === 0) {
    return null;
  }

  const handlePlay = async (song: Song, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const detailedSong = await getSongById(song.id);
      playSong(detailedSong.data[0]);
      toast.success(`Now playing: ${song.title}`);
    } catch (err) {
      toast.error('Failed to play song');
      console.error(err);
    }
  };

  const handleAddToQueue = async (song: Song, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const detailedSong = await getSongById(song.id);
      addToQueue(detailedSong.data[0]);
      toast.success(`Added to queue: ${song.title}`);
    } catch (err) {
      toast.error('Failed to add to queue');
      console.error(err);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Songs</h2>
      <div className="grid gap-3">
        {songs.map((song) => (
          <Card key={song.id} className="overflow-hidden hover:bg-accent/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 flex-shrink-0">
                  {song.image && song.image.length > 0 ? (
                    <ProgressiveImage
                      images={song.image}
                      alt={song.title}
                      entityType={EntityType.SONG}
                      rounded="default"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted rounded">
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
      {showLoadMore && onLoadMore && (
        <LoadMoreButton
          onLoadMore={onLoadMore}
          isLoading={isLoading}
          currentCount={songs.length}
          totalCount={totalCount}
          hasMore={hasMore}
        />
      )}
    </div>
  );
}
