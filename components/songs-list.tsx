'use client';

import { Song } from '@/lib/types';
import { SongItem } from './song-item';
import { usePlayerActions } from '@/contexts/player-context';
import { getSongById } from '@/lib/api';
import { toast } from 'sonner';
import { LoadMoreButton } from './load-more-button';
import { useCallback } from 'react';

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
  const { playSong, addToQueue } = usePlayerActions();

  const handlePlay = useCallback(async (song: Song) => {
    try {
      const detailedSong = await getSongById(song.id);
      playSong(detailedSong.data[0]);
      toast.success(`Now playing: ${song.title}`);
    } catch (err) {
      toast.error('Failed to play song');
      console.error(err);
    }
  }, [playSong]);

  const handleAddToQueue = useCallback(async (song: Song) => {
    try {
      const detailedSong = await getSongById(song.id);
      addToQueue(detailedSong.data[0]);
      toast.success(`Added to queue: ${song.title}`);
    } catch (err) {
      toast.error('Failed to add to queue');
      console.error(err);
    }
  }, [addToQueue]);

  if (songs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Songs</h2>
      <div className="grid gap-3">
        {songs.map((song) => (
          <SongItem 
            key={song.id} 
            song={song}
            onPlay={handlePlay}
            onAddToQueue={handleAddToQueue}
          />
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
