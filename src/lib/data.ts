import { colors } from "./colors";
import type { Song } from "./api";

export interface Playlist {
  id: string;
  title: string;
  color: (typeof colors)[keyof typeof colors];
  cover: string;
  artists: string[];
}

export const playlists: Playlist[] = [];

export const morePlaylists = [];

export const sidebarPlaylists = [];

export const allPlaylists = [];

export const songs: Song[] = [];
