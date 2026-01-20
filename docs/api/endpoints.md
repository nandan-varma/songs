# API Endpoints Reference

This document describes the available API endpoints for the Songs PWA.

## Base URL

```
https://saavn-api.nandanvarma.com/api
```

## Endpoints

### Search

#### Global Search
```http
GET /search?query={query}
```

**Parameters:**
- `query` (string): Search query

**Response:**
```typescript
{
  success: boolean;
  data: {
    albums: { results: Album[]; position: number };
    songs: { results: Song[]; position: number };
    artists: { results: Artist[]; position: number };
    playlists: { results: Playlist[]; position: number };
    topQuery: { results: (Song | Artist)[]; position: number };
  };
}
```

#### Search Songs (Paginated)
```http
GET /search/songs?query={query}&page={page}&limit={limit}
```

**Parameters:**
- `query` (string): Search query
- `page` (number, optional): Page number (default: 0)
- `limit` (number, optional): Results per page (default: 10)

**Response:**
```typescript
{
  success: boolean;
  data: {
    total: number;
    start: number;
    results: DetailedSong[];
  };
}
```

#### Search Albums (Paginated)
```http
GET /search/albums?query={query}&page={page}&limit={limit}
```

**Parameters:**
- `query` (string): Search query
- `page` (number, optional): Page number (default: 0)
- `limit` (number, optional): Results per page (default: 10)

**Response:**
```typescript
{
  success: boolean;
  data: {
    total: number;
    start: number;
    results: AlbumSearchResult[];
  };
}
```

#### Search Artists (Paginated)
```http
GET /search/artists?query={query}&page={page}&limit={limit}
```

**Parameters:**
- `query` (string): Search query
- `page` (number, optional): Page number (default: 0)
- `limit` (number, optional): Results per page (default: 10)

**Response:**
```typescript
{
  success: boolean;
  data: {
    total: number;
    start: number;
    results: ArtistSearchResult[];
  };
}
```

#### Search Playlists (Paginated)
```http
GET /search/playlists?query={query}&page={page}&limit={limit}
```

**Parameters:**
- `query` (string): Search query
- `page` (number, optional): Page number (default: 0)
- `limit` (number, optional): Results per page (default: 10)

**Response:**
```typescript
{
  success: boolean;
  data: {
    total: number;
    start: number;
    results: PlaylistSearchResult[];
  };
}
```

### Songs

#### Get Song Details
```http
GET /songs/{id}
```

**Parameters:**
- `id` (string): Song ID

**Response:**
```typescript
{
  success: boolean;
  data: DetailedSong[];
}
```

#### Get Song Suggestions
```http
GET /songs/{id}/suggestions?limit={limit}
```

**Parameters:**
- `id` (string): Song ID
- `limit` (number, optional): Number of suggestions (default: 10)

**Response:**
```typescript
{
  success: boolean;
  data: DetailedSong[];
}
```

### Albums

#### Get Album Details
```http
GET /albums/{id}
```

**Parameters:**
- `id` (string): Album ID

**Response:**
```typescript
{
  success: boolean;
  data: DetailedAlbum;
}
```

### Artists

#### Get Artist Details
```http
GET /artists/{id}?page={page}&songCount={songCount}&albumCount={albumCount}&sortBy={sortBy}&sortOrder={sortOrder}
```

**Parameters:**
- `id` (string): Artist ID
- `page` (number, optional): Page number (default: 1)
- `songCount` (number, optional): Number of songs (default: 10)
- `albumCount` (number, optional): Number of albums (default: 10)
- `sortBy` (string, optional): Sort by (default: "popularity")
- `sortOrder` (string, optional): Sort order (default: "desc")

**Response:**
```typescript
{
  success: boolean;
  data: DetailedArtist;
}
```

### Playlists

#### Get Playlist Details
```http
GET /playlists/{id}
```

**Parameters:**
- `id` (string): Playlist ID

**Response:**
```typescript
{
  success: boolean;
  data: DetailedPlaylist;
}
```

## Response Types

### Song
```typescript
interface Song {
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
```

### Album
```typescript
interface Album {
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
```

### Artist
```typescript
interface Artist {
	id: string;
	name: string;
	image: Image[];
	type: string;
	description: string;
	url: string;
}
```

### Playlist
```typescript
interface Playlist {
	id: string;
	name: string;
	description: string;
	image: Image[];
	url: string;
	songCount: number;
	language: string;
	explicitContent: boolean;
}
```

### Image
```typescript
interface Image {
	quality: "50x50" | "150x150" | "500x500";
	url: string;
}
```

### DownloadUrl
```typescript
interface DownloadUrl {
	quality: "12kbps" | "48kbps" | "96kbps" | "160kbps" | "320kbps";
	url: string;
}
```

## Error Responses

All endpoints return errors in the following format:

```typescript
{
  success: boolean;
  // Error details (if success is false)
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

## Rate Limiting

The API may impose rate limits. If you receive a `429` status, wait before making additional requests.

## Caching

The application caches API responses using TanStack React Query:
- **Songs**: 10 minutes stale time
- **Albums**: 10 minutes stale time
- **Artists**: 10 minutes stale time
- **Search Results**: 1 minute stale time

## Offline Behavior

When offline, the app:
1. Uses cached data from IndexedDB
2. Falls back to previously fetched data
3. Shows cached song metadata and artwork
4. Allows playback of downloaded songs
