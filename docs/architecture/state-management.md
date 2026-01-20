# State Management

This document describes the state management patterns used in the Songs PWA.

## State Categories

### 1. Server State
Data from the API that needs to be cached and synchronized.

| State | Source | Cache Strategy |
|-------|--------|----------------|
| Song details | Saavn API | React Query (10min stale) |
| Search results | Saavn API | React Query (1min stale) |
| Artist details | Saavn API | React Query (10min stale) |
| Album details | Saavn API | React Query (10min stale) |

### 2. UI State
Local component state for UI interactions.

| State | Location | Purpose |
|-------|----------|---------|
| Modal visibility | Component | Show/hide modals |
| Form values | Component | Track form input |
| Loading states | Component | Show spinners/skeletons |
| Collapse state | Component | Accordion, collapsible sections |

### 3. Global UI State
Shared across multiple components.

| State | Context | Update Frequency |
|-------|---------|-----------------|
| Current song | PlaybackContext | Every second (timeupdate) |
| Playback status | PlaybackContext | On play/pause |
| Volume | PlaybackContext | On volume change |
| Queue | QueueContext | On add/remove/reorder |

### 4. Persistent State
Data that survives page refreshes.

| State | Storage | Purpose |
|-------|---------|---------|
| Downloaded songs | IndexedDB | Offline playback |
| Playback history | IndexedDB | Recently played |
| User preferences | LocalStorage | Theme, language |

## Context Architecture

### Split Context Strategy

To minimize unnecessary re-renders, state is split into three contexts:

```
PlayerProvider
    │
    ├── PlaybackContext (High-frequency updates)
    │   ├── currentSong
    │   ├── isPlaying
    │   ├── volume
    │   ├── currentTime
    │   ├── duration
    │   └── audioRef
    │
    ├── QueueContext (Medium-frequency updates)
    │   ├── queue
    │   └── currentIndex
    │
    └── PlayerActionsContext (Stable references)
        ├── playSong
        ├── playQueue
        ├── addToQueue
        └── ... (all action functions)
```

### Why Split?

| Context | Updates | Re-renders | Impact |
|---------|---------|------------|--------|
| PlaybackContext | ~10/sec (timeupdate) | High | UI needs fast updates |
| QueueContext | On user action | Medium | Queue changes |
| ActionsContext | Never | None | Stable references |

### Implementation

```typescript
// contexts/player-context.tsx
export function PlayerProvider({ children }: { children: ReactNode }) {
	// High-frequency state
	const [currentSong, setCurrentSong] = useState<DetailedSong | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);

	// Medium-frequency state
	const [queue, setQueue] = useState<DetailedSong[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);

	// Stable actions (never change)
	const actions = useMemo(() => ({
		playSong: (song: DetailedSong) => { /* ... */ },
		playNext: () => { /* ... */ },
		togglePlayPause: () => { /* ... */ },
		// ... more actions
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
	}), [queue, currentIndex]);

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

## React Query for Server State

### Configuration

```typescript
// hooks/data/queries.ts
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 10, // 10 minutes
			gcTime: 1000 * 60 * 60, // 1 hour
			retry: 3,
			refetchOnWindowFocus: false,
		},
	},
});
```

### Usage Pattern

```typescript
// In components
function SongPage() {
	const { data: song, isLoading, error } = useSong(id);

	if (isLoading) return <LoadingSpinner />;
	if (error) return <ErrorMessage />;

	return <SongDetail song={song} />;
}

// Custom hook wrapping React Query
function useSong(id: string) {
	return useQuery({
		queryKey: ["song", id],
		queryFn: () => getSongById(id),
		enabled: !!id,
	});
}
```

## State Updates Flow

### Playback State Update

```
User clicks play
        │
        ▼
togglePlayPause() called
        │
        ▼
setIsPlaying(true)
        │
        ▼
useAudioPlayback hook detects change
        │
        ▼
audioRef.current.play()
        │
        ▼
HTML audio element plays
        │
        ▼
'audio' event fires
        │
        ▼
onPlay handler sets isPlaying(true)
        │
        ▼
UI updates (play button shows pause icon)
```

### Queue Update

```
User adds song to queue
        │
        ▼
addToQueue(song) called
        │
        ▼
QueueContext updates queue state
        │
        ▼
All components using QueueContext re-render
        │
        ▼
Queue sheet shows updated list
```

## State Persistence

### IndexedDB Pattern

```typescript
// lib/db/operations.ts
async function saveSongToCache(song: DetailedSong, blob: Blob) {
	const transaction = db.transaction(["songs", "metadata"], "readwrite");
	const songsStore = transaction.objectStore("songs");
	const metadataStore = transaction.objectStore("metadata");

	await songsStore.put({
		id: song.id,
		blob,
		metadata: song,
		cachedAt: Date.now(),
	});

	await metadataStore.put({
		id: song.id,
		data: song,
		cachedAt: Date.now(),
	});
}
```

## State Synchronization

### Queue ↔ Playback Sync

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

### Offline ↔ Online Sync

```typescript
// Switch between cached and streamed content
const { isOfflineMode } = useOffline();

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
// Memoize expensive computations
const processedData = useMemo(() => {
	return data.map(expensiveTransform).filter(predicate);
}, [data]);

// Memoize callbacks
const handleItemClick = useCallback((id: string) => {
	onItemClick(id);
	trackEvent("item_click", { id });
}, [onItemClick]);
```

### Selective Subscriptions

```typescript
// Only subscribe to what you need
function PlaybackControls() {
	// Only re-renders when isPlaying changes
	const { isPlaying } = usePlayback();
	
	// Only re-renders when queue changes
	const { queue } = useQueue();
	
	// Actions never cause re-renders
	const { togglePlayPause } = usePlayerActions();
}
```

## Anti-Patterns to Avoid

### 1. Excessive Context Splitting
```typescript
// BAD - Over-splitting
const VolumeContext = createContext<number>(0.7);
const MuteContext = createContext<boolean>(false);

// These always change together, keep them together
```

### 2. Large Context Values
```typescript
// BAD - Large object in context
const contextValue = {
	// 50+ properties
	allAppState: true,
};

// GOOD - Split into focused contexts
const playbackValue = { /* playback state only */ };
const themeValue = { /* theme state only */ };
```

### 3. Stale Closures
```typescript
// BAD - Stale state in callback
useEffect(() => {
	fetchData(state.id).then(setData);
}, [state.id]); // If state.id is object, may not work as expected

// GOOD - Use functional updates
useEffect(() => {
	fetchData(id).then(setData);
}, [id]); // Use stable id
```

### 4. Unnecessary Re-renders
```typescript
// BAD - Creating objects in render
return <Component data={{ a: 1, b: 2 }} />;

// GOOD - Memoize or use context
const data = useMemo(() => ({ a: 1, b: 2 }), []);
return <Component data={data} />;
```

## Debugging State

### React DevTools

1. Open React DevTools
2. Select component
3. Check "Updates" tab to see why it re-rendered
4. Compare props/state before/after

### State Logging

```typescript
// Add to critical state updates
function setIsPlaying(value: boolean) {
	if (process.env.NODE_ENV === "development") {
		console.log("[State] isPlaying:", {
			from: isPlayingRef.current,
			to: value,
			stack: new Error().stack,
		});
	}
	setIsPlaying(value);
}
```
