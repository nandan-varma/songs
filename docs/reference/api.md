# API Reference

External API endpoints and types for the Songs PWA.

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

#### Search Artists (Paginated)

```http
GET /search/artists?query={query}&page={page}&limit={limit}
```

#### Search Playlists (Paginated)

```http
GET /search/playlists?query={query}&page={page}&limit={limit}
```

### Songs

#### Get Song Details

```http
GET /songs/{id}
```

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

### Albums

#### Get Album Details

```http
GET /albums/{id}
```

### Artists

#### Get Artist Details

```http
GET /artists/{id}?page={page}&songCount={songCount}&albumCount={albumCount}&sortBy={sortBy}&sortOrder={sortOrder}
```

### Playlists

#### Get Playlist Details

```http
GET /playlists/{id}
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

### DetailedSong

```typescript
interface DetailedSong {
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

### DetailedAlbum

```typescript
interface DetailedAlbum {
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

### DetailedArtist

```typescript
interface DetailedArtist {
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

### DetailedPlaylist

```typescript
interface DetailedPlaylist {
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

### ArtistMini

```typescript
interface ArtistMini {
	id: string;
	name: string;
	role: string;
	type: EntityType | string;
	image: Image[];
	url: string;
}
```

### AlbumMini

```typescript
interface AlbumMini {
	id: string | null;
	name: string | null;
	url: string | null;
}
```

## Error Responses

All endpoints return errors in the following format:

```typescript
{
	success: boolean;
	// Error details when success is false
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `429` - Rate Limited
- `500` - Server Error

## Rate Limiting

The API may impose rate limits. If you receive a `429` status, wait before making additional requests.

## Caching

The application caches API responses using TanStack React Query:

| Endpoint | staleTime |
|----------|-----------|
| Songs | 10 minutes |
| Albums | 10 minutes |
| Artists | 10 minutes |
| Playlists | 10 minutes |
| Search Results | 1 minute |

## Offline Behavior

When offline, the app:

1. Uses cached data from IndexedDB
2. Falls back to previously fetched data
3. Shows cached song metadata and artwork
4. Allows playback of downloaded songs
