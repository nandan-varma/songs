# Contexts Reference

## PlayerContext

The main player context, split into three tiers.

### PlaybackContext (High-frequency)

```typescript
interface PlaybackState {
	currentSong: DetailedSong | null;
	isPlaying: boolean;
	volume: number;
	currentTime: number;
	duration: number;
	audioRef: React.RefObject<HTMLAudioElement>;
}
```

**Usage:**
```typescript
import { usePlayer } from "@/contexts/player-context";

function ProgressBar() {
	const { currentTime, duration } = usePlayer();
	const progress = (currentTime / duration) * 100;
	return <div style={{ width: `${progress}%` }} />;
}
```

### QueueContext (Medium-frequency)

```typescript
interface QueueState {
	queue: DetailedSong[];
	currentIndex: number;
	isShuffleEnabled: boolean;
}
```

**Usage:**
```typescript
import { useQueue } from "@/contexts/player-context";

function QueueList() {
	const { queue, currentIndex } = useQueue();
	return (
		<ul>
			{queue.map((song, index) => (
				<li key={song.id} data-active={index === currentIndex}>
					{song.name}
				</li>
			))}
		</ul>
	);
}
```

### PlayerActionsContext (Stable)

```typescript
interface PlayerActions {
	playSong: (song: DetailedSong, replaceQueue?: boolean) => void;
	playQueue: (songs: DetailedSong[], startIndex?: number) => void;
	addToQueue: (song: DetailedSong) => void;
	addSongsToQueue: (songs: DetailedSong[]) => void;
	removeSongFromQueue: (songId: string) => void;
	clearQueue: () => void;
	togglePlayPause: () => void;
	playNext: () => void;
	playPrevious: () => void;
	seekTo: (time: number) => void;
	setVolume: (volume: number) => void;
	reorderQueue: (fromIndex: number, toIndex: number) => void;
	setCurrentIndex: (index: number) => void;
	toggleShuffle: () => void;
}
```

**Usage:**
```typescript
import { usePlayerActions } from "@/contexts/player-context";

function PlayButton() {
	const { togglePlayPause } = usePlayerActions();
	return <button onClick={togglePlayPause}>Play</button>;
}
```

## FavoritesContext

Manages user favorite songs.

```typescript
interface FavoritesContextType {
	favorites: DetailedSong[];
	isLoading: boolean;
	addFavorite: (song: DetailedSong) => void;
	removeFavorite: (songId: string) => void;
	isFavorite: (songId: string) => boolean;
	toggleFavorite: (song: DetailedSong) => void;
}
```

**Usage:**
```typescript
import { useFavorites } from "@/contexts/favorites-context";

function FavoriteButton({ song }: { song: DetailedSong }) {
	const { isFavorite, toggleFavorite } = useFavorites();
	return (
		<button onClick={() => toggleFavorite(song)}>
			{isFavorite(song.id) ? "❤️" : "🤍"}
		</button>
	);
}
```

## LocalPlaylistsContext

Manages user-created playlists.

```typescript
interface LocalPlaylistsContextType {
	playlists: LocalPlaylist[];
	isLoading: boolean;
	createPlaylist: (name: string) => LocalPlaylist;
	deletePlaylist: (id: string) => void;
	addSongToPlaylist: (playlistId: string, song: DetailedSong) => void;
	removeSongFromPlaylist: (playlistId: string, songId: string) => void;
	renamePlaylist: (id: string, name: string) => void;
	reorderPlaylistSongs: (playlistId: string, songs: DetailedSong[]) => void;
}
```

**Usage:**
```typescript
import { useLocalPlaylists } from "@/contexts/local-playlists-context";

function PlaylistCreator() {
	const { createPlaylist } = useLocalPlaylists();
	return (
		<button onClick={() => createPlaylist("My Playlist")}>
			Create Playlist
		</button>
	);
}
```

## HistoryContext

Manages playback history.

```typescript
interface HistoryContextType {
	history: DetailedSong[];
	isLoading: boolean;
	addToHistory: (song: DetailedSong) => void;
	clearHistory: () => void;
	removeFromHistory: (songId: string) => void;
}
```

**Usage:**
```typescript
import { useHistory } from "@/contexts/history-context";

function HistoryList() {
	const { history, clearHistory } = useHistory();
	return (
		<div>
			<button onClick={clearHistory}>Clear History</button>
			<ul>
				{history.map((song) => (
					<li key={song.id}>{song.name}</li>
				))}
			</ul>
		</div>
	);
}
```

## DownloadsContext

Manages downloaded songs and download progress.

```typescript
interface DownloadsContextType {
	downloads: DownloadedSong[];
	isDownloading: boolean;
	downloadProgress: Record<string, number>;
	startDownload: (song: DetailedSong) => void;
	cancelDownload: (songId: string) => void;
	deleteDownload: (songId: string) => void;
	isDownloaded: (songId: string) => boolean;
}
```

**Usage:**
```typescript
import { useDownloads } from "@/contexts/downloads-context";

function DownloadButton({ song }: { song: DetailedSong }) {
	const { startDownload, isDownloaded, downloadProgress } = useDownloads();
	const progress = downloadProgress[song.id];

	return (
		<button
			onClick={() => startDownload(song)}
			disabled={isDownloaded(song.id)}
		>
			{progress !== undefined
				? `Downloading ${progress}%`
				: isDownloaded(song.id)
					? "Downloaded"
					: "Download"}
		</button>
	);
}
```

## OfflineContext

Manages network and offline state.

```typescript
interface OfflineContextType {
	isOnline: boolean;
	isOfflineMode: boolean;
	isOffline: boolean;
	getFilteredSongs: (songs: DetailedSong[]) => DetailedSong[];
}
```

**Usage:**
```typescript
import { useOffline } from "@/contexts/offline-context";

function OfflineIndicator() {
	const { isOffline } = useOffline();
	return isOffline ? (
		<div className="offline-badge">Offline Mode</div>
	) : null;
}
```

## Context Provider Setup

### app/providers.tsx

```typescript
"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlayerProvider } from "@/contexts/player-context";
import { FavoritesProvider } from "@/contexts/favorites-context";
import { LocalPlaylistsProvider } from "@/contexts/local-playlists-context";
import { HistoryProvider } from "@/contexts/history-context";
import { DownloadsProvider } from "@/contexts/downloads-context";
import { OfflineProvider } from "@/contexts/offline-context";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<OfflineProvider>
				<DownloadsProvider>
					<PlayerProvider>
						<FavoritesProvider>
							<LocalPlaylistsProvider>
								<HistoryProvider>
									{children}
								</HistoryProvider>
							</LocalPlaylistsProvider>
						</FavoritesProvider>
					</PlayerProvider>
				</DownloadsProvider>
			</OfflineProvider>
		</QueryClientProvider>
	);
}
```

## Context Hierarchy

```
QueryClientProvider
└── OfflineProvider
    └── DownloadsProvider
        └── PlayerProvider
            ├── FavoritesProvider
            ├── LocalPlaylistsProvider
            └── HistoryProvider
```

## Best Practices

1. **Only subscribe to needed state**: Use separate contexts for different update frequencies
2. **Memoize context values**: Use `useMemo` to prevent unnecessary re-renders
3. **Handle undefined context**: Throw error if used outside provider
4. **Use hooks for access**: Always use `useX` hooks instead of direct context access
