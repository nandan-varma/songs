'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSongById, getSongSuggestions } from '@/lib/api';
import { DetailedSong } from '@/lib/types';
import { usePlayer } from '@/contexts/player-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, Plus, Download, Loader2, Music2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SongPage() {
  const params = useParams();
  const songId = params.id as string;
  const { playSong, addToQueue } = usePlayer();
  
  const [song, setSong] = useState<DetailedSong | null>(null);
  const [suggestions, setSuggestions] = useState<DetailedSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [songResponse, suggestionsResponse] = await Promise.all([
          getSongById(songId),
          getSongSuggestions(songId, 10),
        ]);
        
        if (songResponse.data && songResponse.data.length > 0) {
          setSong(songResponse.data[0]);
        }
        
        if (suggestionsResponse.data) {
          setSuggestions(suggestionsResponse.data);
        }
      } catch (err) {
        setError('Failed to load song');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [songId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-destructive">{error || 'Song not found'}</p>
      </div>
    );
  }

  const imageUrl = song.image?.[2]?.url || song.image?.[0]?.url;

  return (
    <div className="container mx-auto px-4 py-8 pb-32 space-y-8">
      {/* Song Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Album Art */}
            <div className="relative aspect-square w-full md:w-64 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={song.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Music2 className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Song Details */}
            <div className="flex-1 space-y-4">
              <div>
                <Badge variant="secondary" className="mb-2">Song</Badge>
                <h1 className="text-4xl font-bold">{song.name}</h1>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Artists: </span>
                  {song.artists?.primary?.map((artist, index) => (
                    <span key={artist.id}>
                      <Link
                        href={`/artists/${artist.id}`}
                        className="text-sm hover:underline"
                      >
                        {artist.name}
                      </Link>
                      {index < song.artists.primary.length - 1 && ', '}
                    </span>
                  ))}
                </div>

                {song.album?.name && (
                  <div>
                    <span className="text-sm text-muted-foreground">Album: </span>
                    {song.album.id ? (
                      <Link
                        href={`/albums/${song.album.id}`}
                        className="text-sm hover:underline"
                      >
                        {song.album.name}
                      </Link>
                    ) : (
                      <span className="text-sm">{song.album.name}</span>
                    )}
                  </div>
                )}

                <div className="flex gap-4 text-sm text-muted-foreground">
                  {song.year && <span>{song.year}</span>}
                  {song.language && <span className="capitalize">{song.language}</span>}
                  {song.duration && (
                    <span>{Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</span>
                  )}
                </div>

                {song.hasLyrics && (
                  <Badge variant="outline">Lyrics Available</Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="lg"
                  onClick={() => {
                    playSong(song);
                    toast.success(`Now playing: ${song.name}`);
                  }}
                  className="gap-2"
                >
                  <Play className="h-5 w-5" />
                  Play
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    addToQueue(song);
                    toast.success(`Added to queue: ${song.name}`);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add to Queue
                </Button>
              </div>

              {/* Download Options */}
              {song.downloadUrl && song.downloadUrl.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Download Quality:</p>
                  <div className="flex flex-wrap gap-2">
                    {song.downloadUrl.map((url) => (
                      <Button
                        key={url.quality}
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={url.url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          {url.quality}
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">You Might Also Like</h2>
            <div className="grid gap-3">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="overflow-hidden hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                        {suggestion.image?.[1]?.url && (
                          <Image
                            src={suggestion.image[1].url}
                            alt={suggestion.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/songs/${suggestion.id}`}>
                          <h3 className="font-medium truncate hover:underline">{suggestion.name}</h3>
                        </Link>
                        <p className="text-sm text-muted-foreground truncate">
                          {suggestion.artists?.primary?.map(a => a.name).join(', ')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            playSong(suggestion);
                            toast.success(`Now playing: ${suggestion.name}`);
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
                            addToQueue(suggestion);
                            toast.success(`Added to queue: ${suggestion.name}`);
                          }}
                          aria-label="Add to queue"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        {suggestion.downloadUrl && suggestion.downloadUrl.length > 0 && (
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
                            <a href={suggestion.downloadUrl[suggestion.downloadUrl.length - 1]?.url} target="_blank" rel="noopener noreferrer">
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
        </>
      )}
    </div>
  );
}
