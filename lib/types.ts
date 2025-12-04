export interface Image {
  quality: string;
  url: string;
}

export interface Song {
  id: string;
  title: string;
  image: Image[];
  album: string;
  url: string;
  type: string;
  description: string;
  primaryArtists: string;
  singers: string;
  language: string;
}

export interface Album {
  id: string;
  title: string;
  image: Image[];
  artist: string;
  url: string;
  type: string;
  description: string;
  year: string;
  language: string;
  songIds: string;
}

export interface Artist {
  id: string;
  title: string;
  image: Image[];
  type: string;
  description: string;
  position?: number;
}

export interface Playlist {
  id: string;
  title: string;
  image: Image[];
  url: string;
  language: string;
  type: string;
  description: string;
}

export interface SearchResultSection<T> {
  results: T[];
  position: number;
}

export interface SearchResponse {
  success: boolean;
  data: {
    albums: SearchResultSection<Album>;
    songs: SearchResultSection<Song>;
    artists: SearchResultSection<Artist>;
    playlists: SearchResultSection<Playlist>;
    topQuery: SearchResultSection<Song | Artist>;
  };
}
