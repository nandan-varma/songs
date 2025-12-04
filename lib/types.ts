export interface Image {
  quality: string;
  url: string;
}

export interface DownloadUrl {
  quality: string;
  url: string;
}

// Basic types for search results
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

// Detailed types for individual pages
export interface ArtistMini {
  id: string;
  name: string;
  role: string;
  type: string;
  image: Image[];
  url: string;
}

export interface AlbumMini {
  id: string | null;
  name: string | null;
  url: string | null;
}

export interface DetailedSong {
  id: string;
  name: string;
  type: string;
  year: string | null;
  releaseDate: string | null;
  duration: number | null;
  label: string | null;
  explicitContent: boolean;
  playCount: number | null;
  language: string;
  hasLyrics: boolean;
  lyricsId: string | null;
  url: string;
  copyright: string | null;
  album: AlbumMini;
  artists: {
    primary: ArtistMini[];
    featured: ArtistMini[];
    all: ArtistMini[];
  };
  image: Image[];
  downloadUrl: DownloadUrl[];
}

export interface Bio {
  text: string | null;
  title: string | null;
  sequence: number | null;
}

export interface DetailedAlbum {
  id: string;
  name: string;
  description: string;
  year: number | null;
  type: string;
  playCount: number | null;
  language: string;
  explicitContent: boolean;
  artists: {
    primary: ArtistMini[];
    featured: ArtistMini[];
    all: ArtistMini[];
  };
  songCount: number | null;
  url: string;
  image: Image[];
  songs: DetailedSong[];
}

export interface DetailedArtist {
  id: string;
  name: string;
  url: string;
  type: string;
  image: Image[];
  followerCount: number | null;
  fanCount: string | null;
  isVerified: boolean | null;
  dominantLanguage: string | null;
  dominantType: string | null;
  bio: Bio[] | null;
  dob: string | null;
  fb: string | null;
  twitter: string | null;
  wiki: string | null;
  availableLanguages: string[];
  isRadioPresent: boolean | null;
  topSongs: DetailedSong[] | null;
  topAlbums: DetailedAlbum[] | null;
  singles: DetailedSong[] | null;
  similarArtists: ArtistMini[] | null;
}

export interface DetailedPlaylist {
  id: string;
  name: string;
  description: string;
  year: number | null;
  type: string;
  playCount: number | null;
  language: string;
  explicitContent: boolean;
  songCount: number | null;
  url: string;
  image: Image[];
  songs: DetailedSong[];
  artists: ArtistMini[];
}

// Search and pagination
export interface SearchResultSection<T> {
  results: T[];
  position: number;
}

export interface PaginatedResponse<T> {
  total: number;
  start: number;
  results: T[];
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
