import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Song, DetailedSong } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function detailedSongToSong(detailedSong: DetailedSong): Song {
  return {
    id: detailedSong.id,
    title: detailedSong.name,
    image: detailedSong.image,
    album: detailedSong.album.name || '',
    url: detailedSong.url,
    type: detailedSong.type,
    description: detailedSong.artists.primary.map(a => a.name).join(', '),
    primaryArtists: detailedSong.artists.primary.map(a => a.name).join(', '),
    singers: detailedSong.artists.all.map(a => a.name).join(', '),
    language: detailedSong.language,
  };
}