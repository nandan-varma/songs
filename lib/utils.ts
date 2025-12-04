import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Song, DetailedSong } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertToDetailedSong(song: Song): DetailedSong {
  return {
    id: song.id,
    name: song.title,
    type: song.type,
    year: null,
    releaseDate: null,
    duration: null,
    label: null,
    explicitContent: false,
    playCount: null,
    language: song.language,
    hasLyrics: false,
    lyricsId: null,
    url: song.url,
    copyright: null,
    album: {
      id: null,
      name: song.album,
      url: null,
    },
    artists: {
      primary: song.primaryArtists.split(', ').map((name, idx) => ({
        id: `artist-${idx}`,
        name,
        role: 'primary_artists',
        type: 'artist',
        image: [],
        url: '',
      })),
      featured: [],
      all: [],
    },
    image: song.image,
    downloadUrl: [],
  };
}
