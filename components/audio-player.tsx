'use client';

import { usePlayer } from '@/contexts/player-context';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ListMusic, Minus } from 'lucide-react';
import { ProgressiveImage } from './progressive-image';
import { EntityType } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioPlayer() {
  const {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    queue,
    currentIndex,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    removeFromQueue,
    audioRef,
  } = usePlayer();

  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);

  useEffect(() => {
    if (!currentSong || !audioRef.current) return;

    // Get highest quality download URL
    const downloadUrl = currentSong.downloadUrl?.find(
      (url) => url.quality === '320kbps'
    ) || currentSong.downloadUrl?.[currentSong.downloadUrl.length - 1];

    if (downloadUrl?.url && audioRef.current.src !== downloadUrl.url) {
      audioRef.current.src = downloadUrl.url;
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }

    // Set Media Session metadata for OS-level controls
    if ('mediaSession' in navigator) {
      const artwork = currentSong.image?.map(img => ({
        src: img.url,
        sizes: img.quality === '500x500' ? '500x500' : img.quality === '150x150' ? '150x150' : '50x50',
        type: 'image/jpeg'
      })) || [];

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.name,
        artist: currentSong.artists?.primary?.map(a => a.name).join(', ') || 'Unknown Artist',
        album: currentSong.album?.name || 'Unknown Album',
        artwork: artwork.length > 0 ? artwork : undefined,
      });

      // Set up action handlers
      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current) {
          audioRef.current.play().catch(console.error);
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPrevious();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNext();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime && audioRef.current) {
          seekTo(details.seekTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        if (audioRef.current) {
          const skipTime = details.seekOffset || 10;
          seekTo(Math.max(0, currentTime - skipTime));
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        if (audioRef.current) {
          const skipTime = details.seekOffset || 10;
          seekTo(Math.min(duration, currentTime + skipTime));
        }
      });
    }
  }, [currentSong, audioRef, isPlaying, playNext, playPrevious, seekTo, currentTime, duration]);

  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(console.error);
      // Update Media Session playback state
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    } else {
      audioRef.current.pause();
      // Update Media Session playback state
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    }
  }, [isPlaying, audioRef]);

  // Update Media Session position state
  useEffect(() => {
    if ('mediaSession' in navigator && audioRef.current && duration > 0) {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: audioRef.current.playbackRate || 1,
        position: currentTime,
      });
    }
  }, [currentTime, duration, audioRef]);

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  if (!currentSong) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-4 right-4 md:left-6 md:right-6 z-50 max-w-7xl mx-auto">
      <Card className="bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/90 border shadow-2xl">
        <audio ref={audioRef} />
        
        <div className="px-4 md:px-6 py-4 md:py-5">
          {/* Mobile Layout */}
          <div className="md:hidden space-y-4">
            {/* Song Info & Main Controls */}
            <div className="flex items-start gap-3">
              {currentSong.image && currentSong.image.length > 0 && (
                <div className="relative h-16 w-16 flex-shrink-0">
                  <ProgressiveImage
                    images={currentSong.image}
                    alt={currentSong.name}
                    entityType={EntityType.SONG}
                    rounded="default"
                    priority
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate text-base">{currentSong.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {currentSong.artists?.primary?.map(a => a.name).join(', ')}
                </p>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative flex-shrink-0">
                    <ListMusic className="h-5 w-5" />
                    {queue.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                        {queue.length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Queue ({queue.length})</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                    <div className="space-y-2">
                      {queue.map((song, index) => (
                        <div
                          key={`${song.id}-${index}`}
                          className={`flex items-center gap-3 p-2 rounded ${
                            index === currentIndex ? 'bg-accent' : ''
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
                            <p className="text-sm font-medium truncate">{song.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {song.artists?.primary?.map(a => a.name).join(', ')}
                            </p>
                          </div>
                          {index !== currentIndex && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => removeFromQueue(index)}
                            >
                              <Minus />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-10 text-right flex-shrink-0">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={([value]) => seekTo(value)}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10 flex-shrink-0">
                {formatTime(duration)}
              </span>
            </div>

            {/* Playback & Volume Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={playPrevious}
                  disabled={queue.length === 0}
                  className="h-10 w-10"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>

                <Button
                  variant="default"
                  size="icon"
                  onClick={togglePlayPause}
                  className="h-12 w-12"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-0.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={playNext}
                  disabled={queue.length === 0}
                  className="h-10 w-10"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="h-10 w-10"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Slider
                  value={[volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={([value]) => setVolume(value / 100)}
                  className="w-20"
                />
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex items-center gap-6">
            {/* Song Info */}
            <div className="flex items-center gap-4 min-w-0 w-72">
              {currentSong.image && currentSong.image.length > 0 && (
                <div className="relative h-16 w-16 flex-shrink-0">
                  <ProgressiveImage
                    images={currentSong.image}
                    alt={currentSong.name}
                    entityType={EntityType.SONG}
                    rounded="default"
                    priority
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate text-base">{currentSong.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {currentSong.artists?.primary?.map(a => a.name).join(', ')}
                </p>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex flex-col items-center gap-3 flex-1 max-w-2xl">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={playPrevious}
                  disabled={queue.length === 0}
                  className="h-10 w-10"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>

                <Button
                  variant="default"
                  size="icon"
                  onClick={togglePlayPause}
                  className="h-12 w-12"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-0.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={playNext}
                  disabled={queue.length === 0}
                  className="h-10 w-10"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3 w-full">
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={([value]) => seekTo(value)}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Volume & Queue */}
            <div className="flex items-center gap-3 w-72 justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-10 w-10"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>

              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={([value]) => setVolume(value / 100)}
                className="w-28"
              />

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-10 w-10">
                    <ListMusic className="h-5 w-5" />
                    {queue.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                        {queue.length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Queue ({queue.length})</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                    <div className="space-y-2">
                      {queue.map((song, index) => (
                        <div
                          key={`${song.id}-${index}`}
                          className={`flex items-center gap-3 p-2 rounded ${
                            index === currentIndex ? 'bg-accent' : ''
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
                            <p className="text-sm font-medium truncate">{song.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {song.artists?.primary?.map(a => a.name).join(', ')}
                            </p>
                          </div>
                          {index !== currentIndex && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => removeFromQueue(index)}
                            >
                              <Minus />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
