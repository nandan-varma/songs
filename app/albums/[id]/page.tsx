'use client';

import { useParams } from 'next/navigation';
import { usePlayerActions } from '@/contexts/player-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Plus, Loader2, Disc3, Download } from 'lucide-react';
import { ProgressiveImage } from '@/components/progressive-image';
import { EntityType } from '@/lib/types';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAlbum } from '@/hooks/queries';

export default function AlbumPage() {
  const params = useParams();
  const albumId = params.id as string;
  const { playQueue, playSong, addToQueue } = usePlayerActions();
  
  const { data: album, isLoading, error } = useAlbum(albumId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-destructive">{error instanceof Error ? error.message : 'Album not found'}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-32 space-y-8">
      {/* Album Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Album Art */}
            <div className="relative aspect-square w-full md:w-64 flex-shrink-0">
              {album.image && album.image.length > 0 ? (
                <ProgressiveImage
                  images={album.image}
                  alt={album.name}
                  entityType={EntityType.ALBUM}
                  rounded="default"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted rounded-lg">
                  <Disc3 className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Album Details */}
            <div className="flex-1 space-y-4">
              <div>
                <Badge variant="secondary" className="mb-2">Album</Badge>
                <h1 className="text-4xl font-bold">{album.name}</h1>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Artists: </span>
                  {album.artists?.primary?.map((artist, index) => (
                    <span key={artist.id}>
                      <Link
                        href={`/artists/${artist.id}`}
                        className="text-sm hover:underline"
                      >
                        {artist.name}
                      </Link>
                      {index < album.artists.primary.length - 1 && ', '}
                    </span>
                  ))}
                </div>

                <div className="flex gap-4 text-sm text-muted-foreground">
                  {album.year && <span>{album.year}</span>}
                  {album.language && <span className="capitalize">{album.language}</span>}
                  {album.songCount && <span>{album.songCount} songs</span>}
                </div>

                {album.description && (
                  <p className="text-sm text-muted-foreground">{album.description}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="lg"
                  onClick={() => {
                    playQueue(album.songs);
                    toast.success(`Playing ${album.name}`);
                  }}
                  className="gap-2"
                  disabled={!album.songs || album.songs.length === 0}
                >
                  <Play className="h-5 w-5" />
                  Play All
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    album.songs.forEach(song => addToQueue(song));
                    toast.success(`Added ${album.songs.length} songs to queue`);
                  }}
                  className="gap-2"
                  disabled={!album.songs || album.songs.length === 0}
                >
                  <Plus className="h-5 w-5" />
                  Add All to Queue
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Track List */}
      {album.songs && album.songs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Tracks</h2>
          <div className="grid gap-2">
            {album.songs.map((song, index) => (
              <Card key={song.id} className="overflow-hidden hover:bg-accent/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                    <div className="relative h-12 w-12 flex-shrink-0">
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
                      <Link href={`/songs/${song.id}`}>
                        <h3 className="font-medium truncate hover:underline">{song.name}</h3>
                      </Link>
                      <div className="text-sm text-muted-foreground truncate">
                        {song.artists?.primary?.map((artist, idx) => (
                          <span key={artist.id}>
                            <Link href={`/artists/${artist.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                              {artist.name}
                            </Link>
                            {idx < song.artists.primary.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    </div>
                    {song.duration && (
                      <span className="text-sm text-muted-foreground">
                        {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          playSong(song);
                          toast.success(`Now playing: ${song.name}`);
                        }}
                        aria-label="Play song"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToQueue(song);
                          toast.success(`Added to queue: ${song.name}`);
                        }}
                        aria-label="Add to queue"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      {song.downloadUrl && song.downloadUrl.length > 0 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          asChild
                          aria-label="Download song"
                        >
                          <a href={song.downloadUrl[song.downloadUrl.length - 1]?.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
