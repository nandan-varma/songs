// Enums for better type safety
export enum ImageQuality {
  LOW = '50x50',
  MEDIUM = '150x150',
  HIGH = '500x500',
}

export enum AudioQuality {
  VERY_LOW = '12kbps',
  LOW = '48kbps',
  MEDIUM = '96kbps',
  HIGH = '160kbps',
  VERY_HIGH = '320kbps',
}

export enum EntityType {
  SONG = 'song',
  ALBUM = 'album',
  ARTIST = 'artist',
  PLAYLIST = 'playlist',
}

export enum ArtistRole {
  PRIMARY = 'primary_artists',
  FEATURED = 'featured_artists',
  SINGER = 'singer',
  LYRICIST = 'lyricist',
  COMPOSER = 'composer',
  MUSIC = 'music',
}

export enum Language {
  HINDI = 'hindi',
  ENGLISH = 'english',
  PUNJABI = 'punjabi',
  TAMIL = 'tamil',
  TELUGU = 'telugu',
  MARATHI = 'marathi',
  GUJARATI = 'gujarati',
  BENGALI = 'bengali',
  KANNADA = 'kannada',
  BHOJPURI = 'bhojpuri',
  MALAYALAM = 'malayalam',
  URDU = 'urdu',
  HARYANVI = 'haryanvi',
  RAJASTHANI = 'rajasthani',
  ODIA = 'odia',
  ASSAMESE = 'assamese',
}

export interface Image {
  quality: ImageQuality | string; // Allow string for flexibility
  url: string;
}

export interface DownloadUrl {
  quality: AudioQuality | string; // Allow string for flexibility
  url: string;
}

// Basic types for search results
export interface Song {
  id: string;
  title: string;
  image: Image[];
  album: string;
  url: string;
  type: EntityType | string;
  description: string;
  primaryArtists: string;
  singers: string;
  language: Language | string;
}

export interface Album {
  id: string;
  title: string;
  image: Image[];
  artist: string;
  url: string;
  type: EntityType | string;
  description: string;
  year: string;
  language: Language | string;
  songIds: string;
}

// Album type returned from paginated search API
export interface AlbumSearchResult {
  id: string;
  name: string;
  description: string;
  url: string;
  year: number;
  type: EntityType | string;
  playCount: number | null;
  language: Language | string;
  explicitContent: boolean;
  artists: {
    primary: ArtistMini[];
    featured: ArtistMini[];
    all: ArtistMini[];
  };
  image: Image[];
}

export interface Artist {
  id: string;
  title: string;
  image: Image[];
  type: EntityType | string;
  description: string;
  position?: number;
}

// Artist type returned from paginated search API
export interface ArtistSearchResult {
  id: string;
  name: string;
  role: string;
  image: Image[];
  type: EntityType | string;
  url: string;
}

export interface Playlist {
  id: string;
  title: string;
  image: Image[];
  url: string;
  language: Language | string;
  type: EntityType | string;
  description: string;
}

// Playlist type returned from paginated search API
export interface PlaylistSearchResult {
  id: string;
  name: string;
  type: EntityType | string;
  image: Image[];
  url: string;
  songCount: number;
  language: Language | string;
  explicitContent: boolean;
}

// Detailed types for individual pages
export interface ArtistMini {
  id: string;
  name: string;
  role: ArtistRole | string;
  type: EntityType | string;
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
  type: EntityType | string;
  year: string | null;
  releaseDate: string | null;
  duration: number | null;
  label: string | null;
  explicitContent: boolean;
  playCount: number | null;
  language: Language | string;
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
  type: EntityType | string;
  playCount: number | null;
  language: Language | string;
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
  type: EntityType | string;
  image: Image[];
  followerCount: number | null;
  fanCount: string | null;
  isVerified: boolean | null;
  dominantLanguage: Language | string | null;
  dominantType: EntityType | string | null;
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
  type: EntityType | string;
  playCount: number | null;
  language: Language | string;
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
