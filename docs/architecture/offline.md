# Offline Mode

The Songs PWA provides full offline functionality through a multi-layered architecture.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Service Worker                              │
│  - Network interception                                         │
│  - Cache strategies                                             │
│  - Offline fallback                                            │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Network Detection                             │
│  - navigator.onLine monitoring                                  │
│  - online/offline events                                        │
│  - Coordinates with Service Worker                              │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       IndexedDB                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │     songs     │  │    images    │  │      metadata        │   │
│  │  {id, blob}   │  │  {url, blob} │  │    {id, data}        │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Cache Manager                                │
│  - LRU eviction                                                 │
│  - Storage size tracking                                        │
│  - Cache cleanup                                                │
└─────────────────────────────────────────────────────────────────┘
```

## IndexedDB Schema

### Songs Store

```typescript
interface CachedSong {
	id: string;
	blob: Blob;
	metadata: DetailedSong;
	cachedAt: number;
	size: number;
}
```

### Images Store

```typescript
interface CachedImage {
	url: string;
	blob: Blob;
	cachedAt: number;
	size: number;
}
```

### Metadata Store

```typescript
interface CachedMetadata {
	id: string;
	data: DetailedSong;
	cachedAt: number;
}
```

## Cache Management

### LRU (Least Recently Used) Strategy

```typescript
class CacheManager {
	private maxSize: number;
	private currentSize: number;

	async addSong(song: CachedSong): Promise<void> {
		if (this.currentSize + song.size > this.maxSize) {
			await this.evictOldest();
		}

		await this.db.add("songs", song);
		this.currentSize += song.size;
	}

	private async evictOldest(): Promise<void> {
		const songs = await this.db.getAll("songs");
		const oldest = songs.sort((a, b) => a.cachedAt - b.cachedAt)[0];

		if (oldest) {
			await this.db.delete("songs", oldest.id);
			this.currentSize -= oldest.size;
		}
	}
}
```

### Storage Limits

```typescript
// lib/constants/index.ts
export const MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB
export const SONG_SIZE_ESTIMATE = 5 * 1024 * 1024; // ~5MB per song
```

## Network Detection

### Hook Implementation

```typescript
// hooks/network/use-network-detection.ts
export function useNetworkDetection() {
	const [isOnline, setIsOnline] = useState(true);
	const [isOfflineMode, setIsOfflineMode] = useState(false);

	useEffect(() => {
		const handleOnline = () => {
			setIsOnline(true);
			setIsOfflineMode(false);
		};

		const handleOffline = () => {
			setIsOnline(false);
			setIsOfflineMode(true);
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		setIsOnline(navigator.onLine);
		setIsOfflineMode(!navigator.onLine);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	return { isOnline, isOfflineMode, isOffline: !isOnline };
}
```

## Service Worker Strategy

### Caching Levels

| Level | Strategy | Content |
|-------|----------|---------|
| API | Network-first | /api/* - Fall back to cache |
| Static | Cache-first | /static/*, /_next/* - Always from cache |
| User Data | Stale-while-revalidate | Downloads, images |

### Service Worker Code

```typescript
// public/sw.js
const CACHE_STRATEGIES = {
	API: "network-first",
	STATIC: "cache-first",
	USER_DATA: "stale-while-revalidate",
};

self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url);

	let strategy;
	if (url.pathname.startsWith("/api/")) {
		strategy = CACHE_STRATEGIES.API;
	} else if (url.pathname.startsWith("/static/") ||
	           url.pathname.startsWith("/_next/")) {
		strategy = CACHE_STRATEGIES.STATIC;
	} else {
		strategy = CACHE_STRATEGIES.USER_DATA;
	}

	// Apply strategy based on fetch event
});
```

## Offline-Aware Actions

### Wrapper Pattern

```typescript
// hooks/player/use-offline-player.ts
export function useOfflinePlayerActions() {
	const { getFilteredSongs, isOfflineMode } = useOffline();
	const { playSong: rawPlaySong } = usePlayerActions();

	const playSongOfflineAware = (
		song: DetailedSong,
		replaceQueue = true
	) => {
		const filtered = getFilteredSongs([song]);

		if (filtered.length === 0 && isOfflineMode) {
			toast.error("Song not available offline");
			return;
		}

		rawPlaySong(song, replaceQueue);
	};

	return { playSong: playSongOfflineAware };
}
```

## Offline Playback Flow

```
User clicks play
        │
        ▼
Is song cached?
        │
        ├── NO ──► Is offline mode?
        │               │
        │               ├── YES ──► Show toast, skip to next
        │               └── NO ──► Stream from URL
        │
        └── YES ──► Create blob URL from cached data
                          │
                          ▼
                  Play from blob URL
```

## Error Handling

### Fallback Strategies

```typescript
try {
	const blob = await getSongBlob(songId);
	if (blob) {
		const url = URL.createObjectURL(blob);
		audio.src = url;
	} else if (isOfflineMode) {
		throw new Error("Song not cached");
	}
} catch (error) {
	if (isOfflineMode) {
		playNext(); // Skip to next song
	} else {
		retryStream(); // Try streaming instead
	}
}
```

## Performance Considerations

### Image Caching

```typescript
// Only cache images when explicitly requested
async function cacheSongImages(song: DetailedSong): Promise<void> {
	for (const image of song.image) {
		if (!isCached(image.url)) {
			const response = await fetch(image.url);
			const blob = await response.blob();
			await imageCache.add({ url: image.url, blob });
		}
	}
}
```

### Background Sync

```typescript
// Sync in background when online
useEffect(() => {
	if (isOnline && hasPendingDownloads) {
		processDownloadQueue();
	}
}, [isOnline]);
```

## Testing Offline Functionality

### Manual Testing

1. **Enable offline mode**: DevTools > Network > Offline
2. **Play cached songs**: Should work normally
3. **Play uncached songs**: Should show error/toast
4. **Go back online**: Should resume normal behavior
5. **Check IndexedDB**: Data should persist

### Automated Testing

```typescript
describe("Offline Mode", () => {
	beforeEach(() => {
		Object.defineProperty(navigator, "onLine", {
			value: false,
			configurable: true,
		});
	});

	it("plays cached songs when offline", async () => {
		const cachedSong = await cacheSong(testSong);
		await playSong(cachedSong.id);
		expect(audioRef.current.src).toBeTruthy();
	});

	it("shows error for uncached songs when offline", async () => {
		await playSong(uncachedSongId);
		expect(toast.error).toHaveBeenCalledWith(
			expect.stringContaining("not available offline")
		);
	});
});
```

## Best Practices

1. **Cache only user-requested content** - Don't auto-download everything
2. **Show storage usage** - Let users manage cache size
3. **Provide feedback** - Toast notifications for cache status
4. **Handle errors gracefully** - Skip songs, don't crash
5. **Test on real devices** - Emulated offline differs from real
6. **Consider data limits** - Warn users on mobile data

## Storage Management

### Check Available Storage

```typescript
// hooks/storage/use-device-storage.ts
export function useDeviceStorage() {
	const [storageEstimate, setStorageEstimate] = useState<StorageEstimate>();

	useEffect(() => {
		if ("storage" in navigator && "estimate" in navigator.storage) {
			navigator.storage.estimate().then(setStorageEstimate);
		}
	}, []);

	return {
		usage: storageEstimate?.usage ?? 0,
		quota: storageEstimate?.quota ?? 0,
		percentage: storageEstimate?.usage && storageEstimate?.quota
			? (storageEstimate.usage / storageEstimate.quota) * 100
			: 0,
	};
}
```

### Clear Cache

```typescript
async function clearCache(): Promise<void> {
	const db = await openDB("songs-db", 1);

	await db.transaction(["songs", "images", "metadata"], "readwrite", (tx) => {
		tx.objectStore("songs").clear();
		tx.objectStore("images").clear();
		tx.objectStore("metadata").clear();
	});
}
```
