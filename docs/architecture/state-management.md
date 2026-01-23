# State Management

The Songs PWA uses a multi-layered state management approach combining React Context, TanStack Query, and persistent storage.

## State Categories

### 1. Server State

Data fetched from the API with caching via TanStack Query.

| State | Source | Cache Strategy |
|-------|--------|----------------|
| Song details | Saavn API | staleTime: 10min |
| Album details | Saavn API | staleTime: 10min |
| Artist details | Saavn API | staleTime: 10min |
| Playlist details | Saavn API | staleTime: 10min |
| Search results | Saavn API | staleTime: 1min |

### 2. UI State

Component-local state for interactions.

| State | Location | Purpose |
|-------|----------|---------|
| Modal visibility | Component | Show/hide dialogs |
| Form values | Component | Track form inputs |
| Loading states | Component | Show loading indicators |
| Collapse state | Component | Accordion sections |
| Search query | Component | Track search input |

### 3. Global UI State

Shared across components via React Context.

| State | Context | Update Frequency |
|-------|---------|------------------|
| Current song | PlaybackContext | ~10/sec |
| Is playing | PlaybackContext | On play/pause |
| Volume | PlaybackContext | On change |
| Queue | QueueContext | On queue change |
| Current index | QueueContext | On skip |
| Favorites | FavoritesContext | On favorite toggle |
| Playlists | LocalPlaylistsContext | On playlist change |
| History | HistoryContext | On song play |

### 4. Persistent State

Data surviving page refreshes.

| State | Storage | Purpose |
|-------|---------|---------|
| Downloaded songs | IndexedDB | Offline playback |
| Playback history | IndexedDB | Recently played |
| Favorites | IndexedDB | User favorites |
| Local playlists | IndexedDB | User playlists |
| Preferences | LocalStorage | Theme, animations |

## Context Architecture

### Player Context (3-Tier Split)

The player context is split to minimize re-renders:

```
PlayerProvider
    │
    ├── PlaybackContext (High-frequency)
    │   ├── currentSong
    │   ├── isPlaying
    │   ├── volume
    │   ├── currentTime
    │   ├── duration
    │   └── audioRef
    │
    ├── QueueContext (Medium-frequency)
    │   ├── queue
    │   ├── currentIndex
    │   └── isShuffleEnabled
    │
    └── PlayerActionsContext (Stable)
        ├── playSong()
        ├── playNext()
        ├── playPrevious()
        ├── togglePlayPause()
        ├── seekTo()
        ├── setVolume()
        ├── addToQueue()
        └── reorderQueue()
```

### Why Split?

| Context | Updates/Second | Re-renders | Impact |
|---------|----------------|------------|--------|
| PlaybackContext | ~10 | High | Time updates |
| QueueContext | <1 | Medium | Queue changes |
| ActionsContext | 0 | None | Stable refs |

### Implementation

```typescript
// contexts/player-context.tsx
export function PlayerProvider({ children }: { children: ReactNode }) {
	const audioRef = useRef<HTMLAudioElement>(null);

	// High-frequency state
	const [currentSong, setCurrentSong] = useState<DetailedSong | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);

	// Medium-frequency state
	const [queue, setQueue] = useState<DetailedSong[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isShuffleEnabled, setShuffleEnabled] = useState(false);

	// Stable actions
	const actions = useMemo(() => ({
		playSong: (song: DetailedSong, replaceQueue = true) => { /* ... */ },
		playNext: () => { /* ... */ },
		playPrevious: () => { /* ... */ },
		togglePlayPause: () => { /* ... */ },
		seekTo: (time: number) => { /* ... */ },
		setVolume: (vol: number) => { /* ... */ },
		addToQueue: (song: DetailedSong) => { /* ... */ },
		reorderQueue: (from: number, to: number) => { /* ... */ },
		clearQueue: () => { /* ... */ },
		toggleShuffle: () => { /* ... */ },
	}), []);

	// Context values
	const playbackValue = useMemo(() => ({
		currentSong,
		isPlaying,
		currentTime,
		volume,
		duration,
		audioRef,
	}), [currentSong, isPlaying, currentTime, volume, duration]);

	const queueValue = useMemo(() => ({
		queue,
		currentIndex,
		isShuffleEnabled,
	}), [queue, currentIndex, isShuffleEnabled]);

	const actionsValue = useMemo(() => actions, [actions]);

	return (
		<PlaybackContext.Provider value={playbackValue}>
			<QueueContext.Provider value={queueValue}>
				<PlayerActionsContext.Provider value={actionsValue}>
					{children}
				</PlayerActionsContext.Provider>
			</QueueContext.Provider>
		</PlaybackContext.Provider>
	);
}
```

## All Contexts

### FavoritesContext

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

### LocalPlaylistsContext

Manages user-created playlists with full CRUD.

```typescript
interface LocalPlaylistsContextType {
	playlists: LocalPlaylist[];
	createPlaylist: (name: string) => LocalPlaylist;
	deletePlaylist: (id: string) => void;
	addSongToPlaylist: (playlistId: string, song: DetailedSong) => void;
	removeSongFromPlaylist: (playlistId: string, songId: string) => void;
	renamePlaylist: (id: string, name: string) => void;
	reorderPlaylistSongs: (playlistId: string, songs: DetailedSong[]) => void;
}
```

### HistoryContext

Manages playback history.

```typescript
interface HistoryContextType {
	history: DetailedSong[];
	addToHistory: (song: DetailedSong) => void;
	clearHistory: () => void;
	removeFromHistory: (songId: string) => void;
}
```

### DownloadsContext

Manages downloaded songs and progress.

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

### OfflineContext

Manages network state.

```typescript
interface OfflineContextType {
	isOnline: boolean;
	isOfflineMode: boolean;
	isOffline: boolean;
	getFilteredSongs: (songs: DetailedSong[]) => DetailedSong[];
}
```

## React Query

### Configuration

```typescript
// hooks/data/queries.ts
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 10, // 10 minutes
			gcTime: 1000 * 60 * 60,    // 1 hour
			retry: 3,
			refetchOnWindowFocus: false,
		},
	},
});
```

### Usage Pattern

```typescript
// Custom hook
function useSong(id: string) {
	return useQuery({
		queryKey: ["song", id] as const,
		queryFn: () => getSongById(id),
		enabled: !!id,
	});
}

// In component
function SongPage({ id }: { id: string }) {
	const { data: song, isLoading, error } = useSong(id);

	if (isLoading) return <Skeleton />;
	if (error) return <ErrorMessage />;

	return <SongDetail song={song} />;
}
```

## State Persistence

### IndexedDB

```typescript
// lib/db/operations.ts
async function saveToCache(song: DetailedSong, blob: Blob) {
	const db = await openDB("songs-db", 1);

	await db.transaction(["songs", "metadata"], "readwrite", (tx) => {
		tx.objectStore("songs").put({
			id: song.id,
			blob,
			metadata: song,
			cachedAt: Date.now(),
		});

		tx.objectStore("metadata").put({
			id: song.id,
			data: song,
			cachedAt: Date.now(),
		});
	});
}

async function getFromCache(id: string) {
	const db = await openDB("songs-db", 1);
	return db.get("songs", id);
}
```

## State Synchronization

### Queue ↔ Playback

```typescript
// Ensure currentSong stays in sync with queue
useEffect(() => {
	if (queue.length > 0 && currentIndex < queue.length) {
		setCurrentSong(queue[currentIndex]);
	} else {
		setCurrentSong(null);
	}
}, [queue, currentIndex]);
```

### Offline ↔ Online

```typescript
// Switch between cached and streamed content
const songSource = useMemo(() => {
	if (isOfflineMode) {
		return getCachedBlob(song.id) || null;
	}
	return song.downloadUrl?.find((u) => u.quality === "320kbps")?.url;
}, [song, isOfflineMode]);
```

## Performance Optimization

### Memoization

```typescript
// Expensive computation
const processedData = useMemo(() => {
	return data.map(expensiveTransform).filter(predicate);
}, [data]);

// Callback
const handleClick = useCallback((id: string) => {
	onItemClick(id);
}, [onItemClick]);
```

### Selective Subscriptions

```typescript
function PlaybackControls() {
	// Only re-renders when isPlaying changes
	const { isPlaying } = usePlayback();

	// Only re-renders when queue changes
	const { queue } = useQueue();

	// Actions never cause re-renders
	const { togglePlayPause } = usePlayerActions();
}
```

### URL State with nuqs

```typescript
// For shareable filter/sort state
import { useQueryStates, parseAsString, parseAsBoolean } from "nuqs";

function SearchPage() {
	const [params, setParams] = useQueryStates({
		query: parseAsString.withDefault(""),
		filter: parseAsString,
		includeExplicit: parseAsBoolean.withDefault(false),
	});

	return (
		<input
			value={params.query}
			onChange={(e) => setParams({ query: e.target.value })}
		/>
	);
}
```

## Anti-Patterns

### Don't Over-Split Contexts

```typescript
// BAD
const VolumeContext = createContext<number>(0.7);
const MuteContext = createContext<boolean>(false);

// GOOD - Keep related state together
const PlaybackSettingsContext = createContext<{
	volume: number;
	isMuted: boolean;
}>();
```

### Don't Put Large Objects in Context

```typescript
// BAD
const contextValue = { allAppState: true, 50: properties };

// GOOD - Split into focused contexts
const playbackValue = { currentSong, isPlaying };
```

### Don't Use Stale Closures

```typescript
// BAD
useEffect(() => {
	fetchData(state.id).then(setData);
}, [state.id]); // state.id may be stale

// GOOD
useEffect(() => {
	fetchData(id).then(setData);
}, [id]); // Use stable id
```
