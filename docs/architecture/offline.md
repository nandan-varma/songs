# Offline Architecture

This document describes the offline functionality and architecture of the Songs PWA.

## Overview

The Songs PWA provides full offline functionality through:
1. **IndexedDB Storage** - Persistent storage for songs and metadata
2. **Service Worker** - Network interception and caching
3. **Network Detection** - Automatic online/offline state management
4. **Smart Caching** - LRU-style cache management with size limits

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Service Worker                            │
│  - Intercepts network requests                                   │
│  - Implements caching strategies                                 │
│  - Handles offline fallback                                      │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Network Detection                            │
│  - Monitors navigator.onLine                                    │
│  - Triggers online/offline state changes                        │
│  - Coordinates with Service Worker                              │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       IndexedDB                                  │
│  - songs: { id, blob, metadata, cachedAt }                      │
│  - images: { url, blob, cachedAt }                              │
│  - metadata: { id, data, cachedAt }                             │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Cache Manager                               │
│  - LRU eviction strategy                                         │
│  - Storage size tracking                                         │
│  - Cache cleanup and maintenance                                │
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

interface ImageCache {
	url: string;
	blob: Blob;
	cachedAt: number;
	size: number;
}

interface MetadataCache {
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
		// Remove oldest if over capacity
		if (this.currentSize + song.size > this.maxSize) {
			await this.evictOldest();
		}

		// Add new song
		await this.db.add("songs", song);
		this.currentSize += song.size;
	}

	private async evictOldest(): Promise<void> {
		const songs = await this.db.getAll("songs");
		const oldest = songs.sort((a, b) => a.cachedAt - b.cachedAt)[0];
		
		await this.db.delete("songs", oldest.id);
		this.currentSize -= oldest.size;
	}
}
```

### Storage Limits

```typescript
// In lib/constants/index.ts
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

		// Initial state
		setIsOnline(navigator.onLine);
		setIsOfflineMode(!navigator.onLine);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	return { isOnline, isOfflineMode };
}
```

## Offline-Aware Actions

### Wrapper Pattern

```typescript
// hooks/player/use-offline-player.ts
export function useOfflinePlayerActions() {
	const { getFilteredSongs, isOfflineMode } = useOffline();
	const { playSong: rawPlaySong } = usePlayerActions();

	const playSongOfflineAware = (song: DetailedSong, replaceQueue = true) => {
		const filtered = getFilteredSongs([song]);

		if (filtered.length === 0 && isOfflineMode) {
			toast.error("Song not available offline");
			return;
		}

		rawPlaySong(song, replaceQueue);
	};

	// Similar for other actions...
}
```

## Service Worker Strategy

### Caching Levels

1. **Network First** - API requests (fall back to cache)
2. **Cache First** - Static assets (always from cache)
3. **Stale While Revalidate** - User data (serve cache, update in background)

```javascript
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
	} else if (url.pathname.startsWith("/static/")) {
		strategy = CACHE_STRATEGIES.STATIC;
	} else {
		strategy = CACHE_STRATEGIES.USER_DATA;
	}

	// Apply strategy...
});
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

1. **Enable offline mode in DevTools** > Network > Offline
2. **Play cached songs** - Should work normally
3. **Try to play uncached songs** - Should show error/toast
4. **Go back online** - Should resume normal behavior
5. **Check IndexedDB** - Data should persist

### Automated Testing

```typescript
describe("Offline Mode", () => {
	beforeEach(() => {
		// Mock navigator.onLine
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
