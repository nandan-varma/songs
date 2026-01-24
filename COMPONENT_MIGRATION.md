# Component Migration Guide

## Import Changes

### Player/Queue Contexts
```tsx
// OLD
import { usePlayer, usePlayback, useQueue, usePlayerActions, useQueueActions } from "@/contexts/player-context";
import { useQueue } from "@/contexts/queue-context";

// NEW
import { 
  usePlayerStore,
  usePlaybackState, 
  useQueueState, 
  usePlayerActions 
} from "@/stores/player-store";
```

### Favorites Context
```tsx
// OLD
import { useFavorites } from "@/contexts/favorites-context";

// NEW
import { useFavoritesStore } from "@/stores/favorites-store";
```

### Playlists Context
```tsx
// OLD
import { useLocalPlaylists } from "@/contexts/local-playlists-context";

// NEW
import { usePlaylistsStore } from "@/stores/playlists-store";
```

### History Context
```tsx
// OLD
import { useHistory } from "@/contexts/history-context";
import type { HistoryItem } from "@/contexts/history-context";

// NEW
import { useHistoryStore, type HistoryItem } from "@/stores/history-store";
```

### Downloads Context
```tsx
// OLD
import { useDownloads, useDownloadsState, useDownloadsActions } from "@/contexts/downloads-context";

// NEW
import { useDownloadsStore, useDownloadsState, useDownloadsActions } from "@/stores/downloads-store";
```

### Offline Context
```tsx
// OLD
import { useOffline } from "@/contexts/offline-context";

// NEW
import { useOfflineStore } from "@/stores/offline-store";
```

## Usage Changes

### Player Actions
```tsx
// OLD
const { playSong, playNext, playPrevious, togglePlayPause } = usePlayerActions();
const { addSong, clearQueue } = useQueueActions();

// NEW
const { playSong, playNext, playPrevious, togglePlayPause, addSong, clearQueue } = usePlayerActions();
```

### Queue State
```tsx
// OLD
const { queue, currentIndex, isShuffleEnabled, toggleShuffle } = useQueue();

// NEW
const { queue, currentIndex, isShuffleEnabled } = useQueueState();
const { toggleShuffle } = usePlayerActions(); // actions moved to PlayerActions
```

### Playback State
```tsx
// OLD
const { currentSong, isPlaying, volume, currentTime, duration, audioRef } = usePlayback();

// NEW - For most components (selector optimization)
const { currentSong, isPlaying, volume, currentTime, duration } = usePlaybackState();

// NEW - For audio player (needs audioRef)
const audioRef = useRef<HTMLAudioElement>(null);
const setAudioRef = usePlayerStore((state) => state.setAudioRef);
useEffect(() => {
  if (audioRef.current) {
    setAudioRef(audioRef as React.RefObject<HTMLAudioElement>);
  }
}, [setAudioRef]);
```

### Favorites
```tsx
// OLD
const { favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite } = useFavorites();

// NEW - Direct access (no change needed!)
const { favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite } = useFavoritesStore();

// NEW - Optimized selector (only subscribe to what you need)
const isFavorite = useFavoritesStore((state) => state.isFavorite);
const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
```

### Playlists
```tsx
// OLD
const { playlists, createPlaylist, addSongToPlaylist } = useLocalPlaylists();

// NEW
const { playlists, createPlaylist, addSongToPlaylist } = usePlaylistsStore();
```

### History
```tsx
// OLD
const { history, addToHistory, clearHistory } = useHistory();

// NEW
const { history, addToHistory, clearHistory } = useHistoryStore();
```

### Downloads
```tsx
// OLD
const { cachedSongs, isDownloading } = useDownloadsState();
const { downloadSong, removeSong, isSongCached } = useDownloadsActions();

// NEW - No change needed!
const { cachedSongs, isDownloading } = useDownloadsState();
const { downloadSong, removeSong, isSongCached } = useDownloadsActions();
```

### Offline
```tsx
// OLD
const { isOfflineMode, shouldEnableQuery, getFilteredSongs } = useOffline();

// NEW
const isOfflineMode = useOfflineStore((state) => state.isOfflineMode());
const shouldEnableQuery = useOfflineStore((state) => state.shouldEnableQuery());
const getFilteredSongs = useOfflineStore((state) => state.getFilteredSongs);
```

## Initialization Changes

### No Provider Nesting Needed!
```tsx
// OLD - 7 levels of provider nesting
<QueueProvider>
  <DownloadsProvider>
    <OfflineProvider>
      <FavoritesProvider>
        <LocalPlaylistsProvider>
          <PlayerProvider>
            <HistoryProvider>
              {children}
            </HistoryProvider>
          </PlayerProvider>
        </LocalPlaylistsProvider>
      </FavoritesProvider>
    </OfflineProvider>
  </DownloadsProvider>
</QueueProvider>

// NEW - Just QueryClientProvider + initialization
<QueryClientProvider client={queryClient}>
  {children}
</QueryClientProvider>

// Stores are initialized in Providers component:
useEffect(() => {
  useFavoritesStore.getState().loadFavorites();
  usePlaylistsStore.getState().loadPlaylists();
  useDownloadsStore.getState().loadCachedSongs();
}, []);
```

## Type Changes

### History Item
```tsx
// OLD
import type { HistoryItem } from "@/contexts/history-context";

// NEW
import type { HistoryItem } from "@/stores/history-store";
```

### CachedSong
```tsx
// OLD
import type { CachedSong } from "@/contexts/downloads-context";

// NEW
import type { CachedSong } from "@/stores/downloads-store";
```

## Special Cases

### Audio Player Component
The audio player needs special handling because it manages the audio element:

```tsx
// Create local ref
const audioRef = useRef<HTMLAudioElement>(null);

// Connect to store
const setAudioRef = usePlayerStore((state) => state.setAudioRef);
const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
const setDuration = usePlayerStore((state) => state.setDuration);
const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);

// Initialize
useEffect(() => {
  if (audioRef.current) {
    setAudioRef(audioRef as React.RefObject<HTMLAudioElement>);
  }
}, [setAudioRef]);

// Event listeners
useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
  const handleDurationChange = () => setDuration(audio.duration);
  const handleEnded = () => playNext();
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  audio.addEventListener("timeupdate", handleTimeUpdate);
  audio.addEventListener("durationchange", handleDurationChange);
  audio.addEventListener("ended", handleEnded);
  audio.addEventListener("play", handlePlay);
  audio.addEventListener("pause", handlePause);

  return () => {
    audio.removeEventListener("timeupdate", handleTimeUpdate);
    audio.removeEventListener("durationchange", handleDurationChange);
    audio.removeEventListener("ended", handleEnded);
    audio.removeEventListener("play", handlePlay);
    audio.removeEventListener("pause", handlePause);
  };
}, [playNext, setCurrentTime, setDuration, setIsPlaying]);
```

### Direct Store Access (Outside Components)
```tsx
// OLD - Not possible without context
// Had to pass callbacks down through props

// NEW - Access store directly!
import { usePlayerStore } from "@/stores/player-store";

// In utility functions
function skipToNextSong() {
  usePlayerStore.getState().playNext();
}

// In middleware/interceptors
function getIsOffline() {
  return useOfflineStore.getState().isOfflineMode();
}
```

## Performance Optimizations

### Use Selectors to Minimize Re-renders
```tsx
// BAD - Component re-renders on ANY store change
const store = usePlayerStore();

// GOOD - Only re-renders when currentSong changes
const currentSong = usePlayerStore((state) => state.currentSong);

// BETTER - Use convenience hooks (already optimized)
const { currentSong, isPlaying } = usePlaybackState();
```

### Combine Related Selectors
```tsx
// BAD - Multiple subscriptions
const currentSong = usePlayerStore((state) => state.currentSong);
const isPlaying = usePlayerStore((state) => state.isPlaying);
const volume = usePlayerStore((state) => state.volume);

// GOOD - Single subscription
const { currentSong, isPlaying, volume } = usePlayerStore((state) => ({
  currentSong: state.currentSong,
  isPlaying: state.isPlaying,
  volume: state.volume,
}));

// BEST - Use provided selector hooks
const { currentSong, isPlaying, volume } = usePlaybackState();
```

## Testing Changes

### Old Way (Mock Providers)
```tsx
// OLD
render(
  <QueueProvider>
    <PlayerProvider>
      <Component />
    </PlayerProvider>
  </QueueProvider>
);
```

### New Way (Direct Store Manipulation)
```tsx
// NEW
import { usePlayerStore } from "@/stores/player-store";

beforeEach(() => {
  // Reset store state
  usePlayerStore.setState({
    currentSong: mockSong,
    isPlaying: true,
    queue: [mockSong],
  });
});

render(<Component />);

// Assert on store state
expect(usePlayerStore.getState().currentSong).toBe(mockSong);
```

## Common Errors & Solutions

### Error: "Cannot find name 'useQueue'"
**Solution**: Import from player-store, not queue-context
```tsx
import { useQueueState } from "@/stores/player-store";
```

### Error: "Property 'removeFromQueue' does not exist"
**Solution**: Method renamed to `removeSong`
```tsx
const { removeSong } = usePlayerActions(); // was removeFromQueue
```

### Error: "audioRef is null"
**Solution**: Create local ref and set it in useEffect
```tsx
const audioRef = useRef<HTMLAudioElement>(null);
const setAudioRef = usePlayerStore((state) => state.setAudioRef);
useEffect(() => {
  if (audioRef.current) {
    setAudioRef(audioRef as React.RefObject<HTMLAudioElement>);
  }
}, [setAudioRef]);
```

### Error: "Must be used within Provider"
**Solution**: No providers needed! Just import the store hook directly.

## Files Updated

- [x] `/app/providers.tsx` - Removed all context providers
- [x] `/components/audio-player.tsx` - Updated to use stores
- [ ] `/components/history-list.tsx`
- [ ] `/components/download-button.tsx`
- [ ] `/components/search/search-tab-content.tsx`
- [ ] `/components/search-content.tsx`
- [ ] `/components/common/favorite-button.tsx`
- [ ] `/components/common/playlist-edit-dialog.tsx`
- [ ] `/components/common/song-action-menu.tsx`
- [ ] `/components/common/create-playlist-dialog.tsx`
- [ ] `/components/song-item.tsx`
- [ ] `/components/navigation.tsx`
- [ ] All other components in `components/player/*`
- [ ] All page client components in `app/*/client.tsx`
