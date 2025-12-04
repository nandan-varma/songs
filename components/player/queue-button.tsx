'use client';

import { memo } from 'react';
import { Button } from '../ui/button';
import { ListMusic, Minus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { ScrollArea } from '../ui/scroll-area';
import { ProgressiveImage } from '../progressive-image';
import { DetailedSong, EntityType } from '@/lib/types';
import Link from 'next/link';

interface QueueButtonProps {
  queue: DetailedSong[];
  currentIndex: number;
  onRemoveFromQueue: (index: number) => void;
}

export const QueueButton = memo(function QueueButton({
  queue,
  currentIndex,
  onRemoveFromQueue,
}: QueueButtonProps) {
  const queueCount = queue.length;
  const hasQueue = queueCount > 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-10 w-10"
          aria-label={`Queue (${queueCount} songs)`}
        >
          <ListMusic className="h-5 w-5" />
          {hasQueue && (
            <span 
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center"
              aria-hidden="true"
            >
              {queueCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Queue ({queueCount})</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
          <div className="space-y-2">
            {queue.map((song, index) => {
              const isCurrentSong = index === currentIndex;
              
              return (
                <div
                  key={`${song.id}-${index}`}
                  className={`flex items-center gap-3 p-2 rounded transition-colors ${
                    isCurrentSong ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="relative h-10 w-10 flex-shrink-0">
                    {song.image && song.image.length > 0 && (
                      <ProgressiveImage
                        images={song.image}
                        alt={song.name}
                        entityType={EntityType.SONG}
                        rounded="default"
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/songs/${song.id}`} 
                      className="text-sm font-medium truncate hover:underline block"
                    >
                      {song.name}
                    </Link>
                    <div className="text-xs text-muted-foreground truncate">
                      {song.artists?.primary?.map((artist, idx) => (
                        <span key={artist.id}>
                          <Link href={`/artists/${artist.id}`} className="hover:underline">
                            {artist.name}
                          </Link>
                          {idx < song.artists.primary.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {!isCurrentSong && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onRemoveFromQueue(index)}
                      aria-label={`Remove ${song.name} from queue`}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
});