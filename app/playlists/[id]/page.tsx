'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPlaylistById } from '@/lib/api';
import { DetailedPlaylist } from '@/lib/types';
import { usePlayer } from '@/contexts/player-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Plus, Download, Loader2, ListMusic } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

export default function PlaylistPage() {
  const params = useParams();
  const playlistId = params.id as string;
  const { playQueue, playSong, addToQueue } = usePlayer();
  
  const [playlist, setPlaylist] = useState<DetailedPlaylist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await getPlaylistById(playlistId, 0, 50);
        
        if (response.data) {
          setPlaylist(response.data);
        }
      } catch (err) {
        setError('Failed to load playlist');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [playlistId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-destructive">{error || 'Playlist not found'}</p>
      </div>
    );
  }

  const imageUrl = playlist.image?.[2]?.url || playlist.image?.[0]?.url;

  return (
    <div className="container mx-auto px-4 py-8 pb-32 space-y-8">
      {/* Playlist Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Playlist Cover */}
            <div className="relative aspect-square w-full md:w-64 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={playlist.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ListMusic className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Playlist Details */}
            <div className="flex-1 space-y-4">
              <div>
                <Badge variant="secondary" className="mb-2">Playlist</Badge>
                <h1 className="text-4xl font-bold">{playlist.name}</h1>
              </div>

              <div className="flex gap-4 text-sm text-muted-foreground">
                {playlist.year && <span>{playlist.year}</span>}
                {playlist.language && <span className="capitalize">{playlist.language}</span>}
                {playlist.songCount && <span>{playlist.songCount} songs</span>}
              </div>

              {playlist.description && (
                <p className="text-sm text-muted-foreground">{playlist.description}</p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="lg"
                  onClick={() => {
                    playQueue(playlist.songs);
                    toast.success(`Playing ${playlist.name}`);
                  }}
                  className="gap-2"
                  disabled={!playlist.songs || playlist.songs.length === 0}
                >
                  <Play className="h-5 w-5" />
                  Play All
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    playlist.songs.forEach(song => addToQueue(song));
                    toast.success(`Added ${playlist.songs.length} songs to queue`);
                  }}
                  className="gap-2"
                  disabled={!playlist.songs || playlist.songs.length === 0}
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
      {playlist.songs && playlist.songs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Tracks</h2>
          <div className="grid gap-2">
            {playlist.songs.map((song, index) => (
              <Card key={song.id} className="overflow-hidden hover:bg-accent/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                    <div className="relative h-12 w-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                      {song.image?.[0]?.url && (
                        <Image
                          src={song.image[0].url}
                          alt={song.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/songs/${song.id}`}>
                        <h3 className="font-medium truncate hover:underline">{song.name}</h3>
                      </Link>
                      <p className="text-sm text-muted-foreground truncate">
                        {song.artists?.primary?.map(a => a.name).join(', ')}
                      </p>
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
