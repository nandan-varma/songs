'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getArtistById } from '@/lib/api';
import { DetailedArtist } from '@/lib/types';
import { usePlayer } from '@/contexts/player-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Plus, Download, Loader2, User, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ArtistPage() {
  const params = useParams();
  const artistId = params.id as string;
  const { playQueue, playSong, addToQueue } = usePlayer();
  
  const [artist, setArtist] = useState<DetailedArtist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await getArtistById(artistId, {
          songCount: 20,
          albumCount: 20,
        });
        
        if (response.data) {
          setArtist(response.data);
        }
      } catch (err) {
        setError('Failed to load artist');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [artistId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-destructive">{error || 'Artist not found'}</p>
      </div>
    );
  }

  const imageUrl = artist.image?.[2]?.url || artist.image?.[0]?.url;

  return (
    <div className="container mx-auto px-4 py-8 pb-32 space-y-8">
      {/* Artist Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Artist Image */}
            <div className="relative aspect-square w-full md:w-64 flex-shrink-0 rounded-full overflow-hidden bg-muted">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={artist.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Artist Details */}
            <div className="flex-1 space-y-4">
              <div>
                <Badge variant="secondary" className="mb-2">Artist</Badge>
                {artist.isVerified && (
                  <Badge variant="default" className="mb-2 ml-2">Verified</Badge>
                )}
                <h1 className="text-4xl font-bold">{artist.name}</h1>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {artist.followerCount && (
                  <span>{artist.followerCount.toLocaleString()} followers</span>
                )}
                {artist.dominantLanguage && (
                  <span className="capitalize">{artist.dominantLanguage}</span>
                )}
                {artist.dominantType && (
                  <span className="capitalize">{artist.dominantType}</span>
                )}
              </div>

              {/* Social Links */}
              {(artist.fb || artist.twitter || artist.wiki) && (
                <div className="flex gap-2">
                  {artist.fb && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={artist.fb} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Facebook
                      </a>
                    </Button>
                  )}
                  {artist.twitter && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={artist.twitter} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Twitter
                      </a>
                    </Button>
                  )}
                  {artist.wiki && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={artist.wiki} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Wikipedia
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Songs, Albums, Bio */}
      <Tabs defaultValue="songs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="songs">Top Songs</TabsTrigger>
          <TabsTrigger value="albums">Albums</TabsTrigger>
          {artist.singles && artist.singles.length > 0 && (
            <TabsTrigger value="singles">Singles</TabsTrigger>
          )}
          {artist.bio && artist.bio.length > 0 && (
            <TabsTrigger value="bio">Bio</TabsTrigger>
          )}
        </TabsList>

        {/* Top Songs */}
        <TabsContent value="songs" className="space-y-4">
          {artist.topSongs && artist.topSongs.length > 0 ? (
            <>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    playQueue(artist.topSongs || []);
                    toast.success(`Playing ${artist.name}'s top songs`);
                  }}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Play All
                </Button>
              </div>
              <div className="grid gap-2">
                {artist.topSongs.map((song, index) => (
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
                            {song.album?.name}
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
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">No songs available</p>
          )}
        </TabsContent>

        {/* Albums */}
        <TabsContent value="albums" className="space-y-4">
          {artist.topAlbums && artist.topAlbums.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {artist.topAlbums.map((album) => (
                <Card key={album.id} className="overflow-hidden hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <Link href={`/albums/${album.id}`}>
                      <div className="space-y-3">
                        <div className="relative aspect-square w-full rounded overflow-hidden bg-muted">
                          {album.image?.[2]?.url && (
                            <Image
                              src={album.image[2].url}
                              alt={album.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-medium truncate hover:underline">{album.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {album.year}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No albums available</p>
          )}
        </TabsContent>

        {/* Singles */}
        {artist.singles && artist.singles.length > 0 && (
          <TabsContent value="singles" className="space-y-4">
            <div className="grid gap-2">
              {artist.singles.map((song) => (
                <Card key={song.id} className="overflow-hidden hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
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
                          {song.year}
                        </p>
                      </div>
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
          </TabsContent>
        )}

        {/* Bio */}
        {artist.bio && artist.bio.length > 0 && (
          <TabsContent value="bio" className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                {artist.bio.map((section, index) => (
                  <div key={index}>
                    {section.title && (
                      <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                    )}
                    {section.text && (
                      <p className="text-muted-foreground">{section.text}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Similar Artists */}
      {artist.similarArtists && artist.similarArtists.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Similar Artists</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {artist.similarArtists.slice(0, 8).map((similarArtist) => (
              <Card key={similarArtist.id} className="overflow-hidden hover:bg-accent/50 transition-colors">
                <CardContent className="p-4">
                  <Link href={`/artists/${similarArtist.id}`}>
                    <div className="space-y-3">
                      <div className="relative aspect-square w-full rounded-full overflow-hidden bg-muted">
                        {similarArtist.image?.[2]?.url && (
                          <Image
                            src={similarArtist.image[2].url}
                            alt={similarArtist.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="text-center">
                        <h3 className="font-medium truncate hover:underline">{similarArtist.name}</h3>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
