# Hooks Reference

## Audio Hooks

### useAudioSource

```typescript
import { useAudioSource } from "@/hooks/audio/use-audio-source";

const source = useAudioSource(song, isOfflineMode);
// Returns: string | null
```

Manages audio source loading from blob or URL.

**Parameters:**
- `song`: DetailedSong | null
- `isOfflineMode`: boolean

**Returns:** Audio source URL or null

### useAudioPlayback

```typescript
import { useAudioPlayback } from "@/hooks/audio/use-audio-playback";

const { handleCanPlay } = useAudioPlayback(audioRef, isPlaying, source);
// Returns: { handleCanPlay: () => void }
```

Syncs play/pause state with audio element.

### useAudioEventListeners

```typescript
import { useAudioEventListeners } from "@/hooks/audio/use-audio-event-listeners";

useAudioEventListeners(audioRef, {
	onTimeUpdate: (time) => void,
	onDurationChange: (duration) => void,
	onEnded: () => void,
	onPlay: () => void,
	onPause: () => void,
	onError: (error) => void,
});
```

Attaches and manages audio event listeners.

### useMediaSession

```typescript
import { useMediaSession } from "@/hooks/audio/use-media-session";

useMediaSession(currentSong, isPlaying, currentTime, duration);
```

Integrates with system media controls.

## Player Hooks

### useOfflinePlayer

```typescript
import { useOfflinePlayer } from "@/hooks/player/use-offline-player";

const { playSong, togglePlayPause } = useOfflinePlayer();
// Returns: Offline-aware player actions
```

Provides offline-aware player actions.

### useOfflineSkip

```typescript
import { useOfflineSkip } from "@/hooks/player/use-offline-skip";

useOfflineSkip(currentSong, isOfflineMode, playNext);
```

Auto-skips uncached songs in offline mode.

## Playback Hooks

### usePlaybackSpeed

```typescript
import { usePlaybackSpeed } from "@/hooks/playback/use-playback-speed";

const [speed, setSpeed] = usePlaybackSpeed();
// Returns: [number, (speed: number) => void]
```

Manages playback speed preference.

### useSleepTimer

```typescript
import { useSleepTimer } from "@/hooks/playback/use-sleep-timer";

const [timeRemaining, cancelTimer] = useSleepTimer();
// Returns: [number | null, () => void]
```

Manages sleep timer functionality.

## Data Hooks

### useSong

```typescript
import { useSong } from "@/hooks/pages/use-song";

const { data: song, isLoading, error } = useSong(id);
// Returns: UseQueryResult<DetailedSong>
```

Fetches song details by ID.

### useAlbum

```typescript
import { useAlbum } from "@/hooks/pages/use-album";

const { data: album, isLoading, error } = useAlbum(id);
// Returns: UseQueryResult<DetailedAlbum>
```

Fetches album details by ID.

### useArtist

```typescript
import { useArtist } from "@/hooks/pages/use-artist";

const { data: artist, isLoading, error } = useArtist(id);
// Returns: UseQueryResult<DetailedArtist>
```

Fetches artist details by ID.

### usePlaylist

```typescript
import { usePlaylist } from "@/hooks/pages/use-playlist";

const { data: playlist, isLoading, error } = usePlaylist(id);
// Returns: UseQueryResult<DetailedPlaylist>
```

Fetches playlist details by ID.

### useCacheManager

```typescript
import { useCacheManager } from "@/hooks/data/use-cache-manager";

const { cacheSong, getCachedSong, clearCache } = useCacheManager();
// Returns: Cache manager functions
```

Manages song cache operations.

## Download Hooks

### useDownloadProgress

```typescript
import { useDownloadProgress } from "@/hooks/downloads/use-download-progress";

const progress = useDownloadProgress(songId);
// Returns: number (0-100)
```

Tracks download progress for a song.

### useDownloadRetry

```typescript
import { useDownloadRetry } from "@/hooks/downloads/use-download-retry";

const retryDownload = useDownloadRetry(songId);
// Returns: () => void
```

Retries a failed download.

## Network Hooks

### useNetworkDetection

```typescript
import { useNetworkDetection } from "@/hooks/network/use-network-detection";

const { isOnline, isOfflineMode } = useNetworkDetection();
// Returns: { isOnline: boolean, isOfflineMode: boolean, isOffline: boolean }
```

Detects network connectivity state.

### useServiceWorker

```typescript
import { useServiceWorker } from "@/hooks/network/use-service-worker";

const { isRegistered, updateAvailable } = useServiceWorker();
// Returns: { isRegistered: boolean, updateAvailable: boolean }
```

Manages Service Worker registration.

## Search Hooks

### useSearchHistory

```typescript
import { useSearchHistory } from "@/hooks/search/use-search-history";

const { history, addToHistory, clearHistory } = useSearchHistory();
// Returns: { history: string[], addToHistory: (query: string) => void, clearHistory: () => void }
```

Manages search history.

### useSearchSuggestions

```typescript
import { useSearchSuggestions } from "@/hooks/search/use-search-suggestions";

const suggestions = useSearchSuggestions(query);
// Returns: SearchSuggestion[]
```

Provides search suggestions as user types.

## Storage Hooks

### useDeviceStorage

```typescript
import { useDeviceStorage } from "@/hooks/storage/use-device-storage";

const { usage, quota, percentage } = useDeviceStorage();
// Returns: { usage: number, quota: number, percentage: number }
```

Reports device storage usage.

### useDownloadOperations

```typescript
import { useDownloadOperations } from "@/hooks/storage/use-download-operations";

const { startDownload, cancelDownload, deleteDownload } = useDownloadOperations();
// Returns: Download operation functions
```

Manages download operations.

## UI Hooks

### useAnalytics

```typescript
import { useAnalytics } from "@/hooks/ui/use-analytics";

const { trackEvent, trackPageView } = useAnalytics();
// Returns: { trackEvent: (name: string, params?: object) => void, trackPageView: (page: string) => void }
```

Tracks analytics events.

### useAnimationPreferences

```typescript
import { useAnimationPreferences } from "@/hooks/ui/use-animation-preferences";

const { shouldReduceMotion } = useAnimationPreferences();
// Returns: { shouldReduceMotion: boolean }
```

Respects user animation preferences.

### useKeyboardShortcuts

```typescript
import { useKeyboardShortcuts } from "@/hooks/ui/use-keyboard-shortcuts";

useKeyboardShortcuts();
// No return value, registers global shortcuts
```

Registers global keyboard shortcuts.

### useMobile

```typescript
import { useMobile } from "@/hooks/ui/use-mobile";

const isMobile = useMobile();
// Returns: boolean
```

Detects mobile devices.

### usePWAInstall

```typescript
import { usePWAInstall } from "@/hooks/ui/use-pwa-install";

const { isInstallable, promptInstall } = usePWAInstall();
// Returns: { isInstallable: boolean, promptInstall: () => Promise<void> }
```

Manages PWA installation.

### usePerformanceMonitor

```typescript
import { usePerformanceMonitor } from "@/hooks/ui/use-performance-monitor";

usePerformanceMonitor("ComponentName", { thresholdMs: 16 });
```

Monitors component render performance.

## Context Hooks

### usePlayer

```typescript
import { usePlayer } from "@/contexts/player-context";

const { currentSong, isPlaying, volume, currentTime } = usePlayer();
// Returns: PlaybackContext
```

Accesses playback state.

### useQueue

```typescript
import { useQueue } from "@/contexts/player-context";

const { queue, currentIndex, isShuffleEnabled } = useQueue();
// Returns: QueueContext
```

Accesses queue state.

### usePlayerActions

```typescript
import { usePlayerActions } from "@/contexts/player-context";

const { playSong, playNext, togglePlayPause } = usePlayerActions();
// Returns: PlayerActionsContext
```

Accesses player action functions.

### useFavorites

```typescript
import { useFavorites } from "@/contexts/favorites-context";

const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
// Returns: FavoritesContext
```

Manages favorite songs.

### useLocalPlaylists

```typescript
import { useLocalPlaylists } from "@/contexts/local-playlists-context";

const { playlists, createPlaylist, addSongToPlaylist } = useLocalPlaylists();
// Returns: LocalPlaylistsContext
```

Manages local playlists.

### useHistory

```typescript
import { useHistory } from "@/contexts/history-context";

const { history, addToHistory, clearHistory } = useHistory();
// Returns: HistoryContext
```

Manages playback history.

### useDownloads

```typescript
import { useDownloads } from "@/contexts/downloads-context";

const { downloads, startDownload, deleteDownload } = useDownloads();
// Returns: DownloadsContext
```

Manages downloaded songs.

### useOffline

```typescript
import { useOffline } from "@/contexts/offline-context";

const { isOnline, isOfflineMode, getFilteredSongs } = useOffline();
// Returns: OfflineContext
```

Accesses offline state.
