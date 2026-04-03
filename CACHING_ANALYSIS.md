# Caching Infrastructure Analysis - Songs PWA

## 1. CACHE ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER CACHING LAYERS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ LAYER 1: SERVICE WORKER CACHING (sw.js)                │   │
│  │  - Static assets: cache-first                           │   │
│  │  - Images: cache-first (after fetch)                    │   │
│  │  - HTML pages: network-first                            │   │
│  │  - Strategy: 3 named caches (static/dynamic/images)     │   │
│  └──────────────────────────────────────────────────────────┘   │
│           ↓ (fetch event)                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ LAYER 2: REACT QUERY CLIENT-SIDE CACHING                │   │
│  │  - Metadata: 10 min staleTime (albums/artists/songs)   │   │
│  │  - Search: 1 min staleTime                              │   │
│  │  - Infinite queries: pagination support                 │   │
│  │  - Default: 60s staleTime                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│           ↓ (on-demand access)                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ LAYER 3: CONTEXT-BASED STATE CACHING                    │   │
│  │  - DownloadsContext: cached songs map                    │   │
│  │  - OfflineContext: metadata about cached content         │   │
│  │  - QueueContext: current queue (localStorage)            │   │
│  │  - FavoritesContext: favorite songs (IndexedDB)         │   │
│  │  - HistoryContext: visit history (localStorage)          │   │
│  │  - LocalPlaylistsContext: custom playlists (IndexedDB)   │   │
│  └──────────────────────────────────────────────────────────┘   │
│           ↓ (on-change)                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ LAYER 4: INDEXEDDB PERSISTENT STORAGE                   │   │
│  │  - MusicAppDB: songs metadata, audio blobs, images       │   │
│  │  - MusicAppFavoritesDB: favorite entries                 │   │
│  │  - MusicAppPlaylistsDB: user-created playlists          │   │
│  │  - Limits: 100 songs / 500MB per app                     │   │
│  │  - Eviction: LRU (least recently used) policy            │   │
│  └──────────────────────────────────────────────────────────┘   │
│           ↓ (on-demand/fallback)                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ LAYER 5: LOCALSTORAGE KEY-VALUE PAIRS                   │   │
│  │  - Queue: current queue + current index                  │   │
│  │  - Recently played: playback history                     │   │
│  │  - Search history: past searches                         │   │
│  │  - Settings: user preferences                            │   │
│  │  - Max age: 7 days (queue expires)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ LAYER 6: EXTERNAL SERVICES (NETWORK)                    │   │
│  │  - API calls: /api/songs, /api/search, /api/albums      │   │
│  │  - Audio streams: external URLs                          │   │
│  │  - Images: CDN URLs                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

DATA FLOW (on song download):
  User → DownloadButton → useDownloadOperations
    → downloadSong() 
      → fetch audio blob
      → fetch images (parallel)
      → musicDB.saveSong() [IndexedDB]
      → musicDB.saveAudioBlob() [IndexedDB]
      → musicDB.saveImageBlob() [IndexedDB]
      → musicDB.evictOldestIfNeeded() [LRU eviction]
      → addToCache() [in-memory Map]
      → useCacheManager state update
      → DownloadsContext update
      → OfflineContext reflects change
```

## 2. CACHE-RELATED FILES MAP

### Service Worker Layer
- **`/public/sw.js`** (312 lines)
  - Caches: static-v1, dynamic-v1, images-v1
  - Limits: 500MB total, 100 items per cache
  - Strategy: Install → Activate → Fetch events
  - Build detection: Checks `/build-info.json` periodically
  - Eviction: `evictOldest()` removes oldest entries when limit hit

### IndexedDB Layer
- **`/lib/local_db/connection.ts`** (77 lines)
  - Database: MusicAppDB (v1)
  - Stores: songs, audio, images
  - Indexes: cachedAt, lastAccessed (for LRU)
  - Single connection pooling with promise caching

- **`/lib/local_db/operations.ts`** (355 lines)
  - `SongOperations`: metadata CRUD
  - `AudioOperations`: audio blob storage
  - `ImageOperations`: image blob storage
  - `StorageOperations`: quota queries
  - LRU eviction: 100 song limit, 500MB limit
  - Eviction batch: 10% of cache per eviction

- **`/lib/local_db/index.ts`** (104 lines)
  - Facade `MusicDatabase` unifying all operations
  - Methods: saveSong, getSong, getAudioBlob, saveImageBlob, etc.

- **`/lib/storage/adapters/favorites.ts`** (128 lines)
  - Separate DB: MusicAppFavoritesDB
  - Stores: FavoriteEntry (songId, song, addedAt)

- **`/lib/storage/adapters/playlists.ts`** (implied)
  - Separate DB: MusicAppPlaylistsDB (v3)
  - Stores: LocalPlaylist with songs array

### LocalStorage Layer
- **`/lib/storage/adapters/queue.ts`** (64 lines)
  - Key: music-app-queue
  - Data: SavedQueue (songs[], currentIndex, savedAt)
  - Max age: 7 days (auto-clear)

- **`/lib/storage/adapters/recently-played.ts`**
- **`/lib/storage/adapters/search-history.ts`**
- **`/lib/storage/adapters/history.ts`**
- **`/lib/storage/config.ts`** (212 lines)
  - Centralized storage configuration
  - STORAGE_VERSION: "1.0.0" (for cache busting)
  - LOCAL_STORAGE_KEYS enum
  - INDEXED_DB config map
  - LIMITS constants

- **`/lib/storage/core.ts`** (548 lines)
  - Unified StorageManager class
  - Methods: localGet/Set/Remove, idbGet/Put/Delete/GetAll, etc.
  - Migration support
  - Export/import for backups
  - clearAll() for cache busting

### React Query Layer
- **`/hooks/data/queries.ts`** (393 lines)
  - Query hooks: useAlbum, usePlaylist, useSong, useArtist
  - Infinite queries: useArtistSongs, useArtistAlbums, useSearch*
  - Stale times: 10min (metadata), 1min (search)
  - queryKeys factory for consistent naming
  - Query client: `/app/get-query-client.ts`

### In-Memory Cache (State)
- **`/hooks/data/use-cache-manager.ts`** (143 lines)
  - Hook: useCacheManager()
  - State: Map<songId, CachedSong>
  - Lazy loading: EMPTY_BLOB pattern
  - Methods: ensureBlobLoaded, getSongBlob, isSongCached, etc.
  - Loads from IndexedDB on mount

- **`/contexts/downloads-context.tsx`** (107 lines)
  - DownloadsStateContext: cachedSongs Map, isDownloading flag
  - DownloadsActionsContext: downloadSong, removeSong, getSongBlob
  - Wraps useCacheManager + useDownloadOperations

- **`/hooks/storage/use-download-operations.ts`** (100 lines)
  - Coordinates download + IndexedDB save + eviction
  - Handles image caching in parallel
  - Silent error handling

- **`/hooks/storage/use-device-storage.ts`** (68 lines)
  - File System Access API integration
  - Export cached songs to device filesystem

- **`/contexts/offline-context.tsx`** (104 lines)
  - Detects network status via useNetworkDetection
  - Filters songs to only cached ones when offline
  - Depends on DownloadsContext

### Other Contexts Using Cache
- **`/contexts/favorites-context.tsx`** (129 lines)
  - Uses favoritesStorage (IndexedDB)
  - Load on mount, persist on change

- **`/contexts/history-context.tsx`** (139 lines)
  - Uses localStorage directly
  - Max 10 items, auto-save on change

- **`/contexts/local-playlists-context.tsx`** (302 lines)
  - Uses IndexedDB (separate DB)
  - Full playlist CRUD

- **`/contexts/player-context.tsx`** - Player state (not cache-specific)
- **`/contexts/queue-context.tsx`** - Queue state (uses queueStorage)

### Service Worker Management
- **`/hooks/network/use-service-worker.ts`** (159 lines)
  - Registers SW from /sw.js
  - Listens for update notifications
  - Deployment detection via build-info.json
  - Hourly update checks

- **`/components/offline/service-worker-manager.tsx`**
  - UI component for SW updates

## 3. DATA FLOW THROUGH CACHING LAYERS

### A. Song Download Flow
```
User clicks Download
  → DownloadButton uses useDownloads()
    → downloadSong(song: DetailedSong)
      
      STEP 1: Fetch Audio
      → fetch(downloadUrl) → blob
      
      STEP 2: Save to IndexedDB (Layer 4)
      → musicDB.saveSong(song)           // songs store
      → musicDB.saveAudioBlob(id, blob)  // audio store
      → musicDB.saveImageBlob(id, blob)  // images store (parallel)
      
      STEP 3: Check Limits (LRU)
      → musicDB.evictOldestIfNeeded()
         • Check: 100 songs max OR 500MB max
         • Sort by lastAccessed
         • Delete oldest 10%
      
      STEP 4: Update In-Memory Cache (Layer 3)
      → addToCache(songId, cachedSong)
         • useCacheManager sets Map state
         • Triggers re-renders of dependent components
      
      STEP 5: Context Updates
      → DownloadsContext state changes
      → OfflineContext detects new cached song
      → Components using useDownloads() re-render
```

### B. Song Playback (Offline)
```
User clicks Play (offline)
  → PlayerContext needs audio blob
  
  1. Check OfflineContext.isOfflineMode
     → useNetworkDetection says no network
     → Filter to only cached songs
  
  2. Get blob from Cache
     → useCacheManager.getSongBlob(songId)
        • Check in-memory Map
        • If lazy (EMPTY_BLOB), load from IndexedDB
        → musicDB.getAudioBlob(songId)
     → return Blob
  
  3. Create Object URL
     → URL.createObjectURL(blob)
     → Set as audio.src
  
  4. Track Access (for LRU)
     → musicDB.updateLastAccessed(songId)
```

### C. Search Query Flow
```
User types search query
  → SearchComponent uses useSearchSongs(query)
  
  LAYER 2 (React Query):
  1. Check cache: queryKey = ["search-songs", query]
     → Stale: 1 minute
     → If < 1 min old & has data: return cached
  
  2. If stale/missing:
     → searchSongs(query) API call
  
  LAYER 1 (Service Worker):
  3. fetch(api/search) intercepted by SW
     → Cache-first: check cache first
     → Not found: network call
     → Cache response for next time
  
  4. Data returned to component
     → React Query caches in memory
     → Component renders
```

### D. Image Loading Flow
```
Image component renders for song
  → <img src={song.image[0].url} />
  
  LAYER 1 (Service Worker):
  1. fetch(imageUrl) intercepted
     → request.destination === "image"
     → Try cache first (IMAGE_CACHE)
     → Cache hit: return
     → Cache miss: fetch from network
  
  LAYER 4 (IndexedDB - if downloaded):
  2. Parallel to Service Worker
     → useDownloadOperations downloads images
     → musicDB.saveImageBlob(key, blob)
     → Available for offline playback
```

### E. App Initialization Flow
```
App starts
  → Providers render
    
    1. QueryClientProvider
       → getQueryClient() singleton
       → 60s default staleTime
    
    2. DownloadsProvider
       → useCacheManager() on mount
         • Loads all songs from IndexedDB
         • Lazy-loads blobs (EMPTY_BLOB)
         • Populates in-memory Map
       → useDownloadOperations() creates downloadSong fn
       → useDeviceStorage() for export
    
    3. OfflineProvider
       → useNetworkDetection() detects online status
       → useDownloadsActions() for isSongCached checks
    
    4. FavoritesProvider
       → favoritesStorage.getAll() on mount
       → Loads from IndexedDB
    
    5. HistoryProvider
       → Loads from localStorage
    
    6. LocalPlaylistsProvider
       → openPlaylistsDB() and loads playlists
    
    7. PlayerProvider
       → Loads queue from queueStorage (localStorage)
       → Links to DownloadsContext for offline playback
```

## 4. CACHING LAYERS AND INTERACTIONS

### Layer Interactions Matrix
```
┌──────────────────┬────────────────┬────────────────┬────────────────┐
│ Layer            │ Read From      │ Write To       │ Invalidation   │
├──────────────────┼────────────────┼────────────────┼────────────────┤
│ SW Cache         │ Network        │ Auto (fetch)   │ Manual (msg)   │
│ React Query      │ IndexedDB      │ On API call    │ staleTime      │
│ Context State    │ React Query    │ On user action │ Re-renders     │
│ IndexedDB        │ Downloads      │ In download    │ LRU eviction   │
│ localStorage     │ On app boot    │ Periodic save  │ Manual clear   │
│ Network/API      │ External       │ On demand      │ Not cached     │
└──────────────────┴────────────────┴────────────────┴────────────────┘
```

### Critical Dependencies
```
App Initialization:
  Providers (order matters!)
    ↓
  QueryClientProvider ← React Query caching
    ↓
  QueueProvider ← localStorage
    ↓
  DownloadsProvider ← IndexedDB + in-memory Map
    ↓
  OfflineProvider ← network detection + downloads
    ↓
  FavoritesProvider ← IndexedDB
    ↓
  LocalPlaylistsProvider ← IndexedDB
    ↓
  PlayerProvider ← uses all above
    ↓
  HistoryProvider ← localStorage
```

## 5. COMPLEXITY HOTSPOTS

### High Complexity Areas

#### 1. **Multiple IndexedDB Instances** (CRITICAL)
**Location**: `/lib/local_db/`, `/lib/storage/adapters/`
**Complexity**: VERY HIGH
- **Problem**: 4 separate IndexedDB databases with overlapping responsibilities:
  1. `MusicAppDB` (v1) - songs, audio, images via musicDB facade
  2. `MusicAppFavoritesDB` (v1) - favorites (in adapters/favorites.ts)
  3. `MusicAppPlaylistsDB` (v3) - playlists (direct in context)
  4. Unified `StorageManager` in `/lib/storage/core.ts` trying to abstract all

- **Issues**:
  - No single source of truth for DB management
  - musicDB uses IDBConnection pattern (singleton per DB)
  - favoritesStorage uses separate getDB() factory
  - PlaylistsContext opens DB directly inline
  - Migration logic fragmented
  - Schema upgrades handled inconsistently (onupgradeneeded in multiple places)

- **Redundancy**: LRU eviction logic exists in:
  - SongOperations.evictOldestIfNeeded()
  - sw.js evictOldest() (different algorithm!)
  - Favorites/Playlists have no eviction

**Impact**: ~150 lines of boilerplate, 3 different connection patterns, hard to reason about data consistency

---

#### 2. **In-Memory Cache vs IndexedDB Sync** (HIGH)
**Location**: `/hooks/data/use-cache-manager.ts`, `/contexts/downloads-context.tsx`, `/hooks/storage/use-download-operations.ts`
**Complexity**: HIGH
- **Problem**: Dual state management
  - useCacheManager: Map<songId, CachedSong> in React state
  - IndexedDB: actual source of truth
  - EMPTY_BLOB pattern: lazy-loading from disk to memory

- **Issues**:
  ```
  1. Init: useCacheManager loads ALL songs metadata into Map on mount
     - O(n) operation, no pagination
     - EMPTY_BLOB = missing audio payload initially
     
  2. Get: getSongBlob() checks in-memory first, then IndexedDB
     - ensureBlobLoaded() async updates state
     - Callback dependency on cachedSongs causes re-renders
     
  3. Update: addToCache/removeFromCache trigger immediate re-renders
     - No debouncing
     - 100 listeners re-render on each download
     
  4. Sync: No explicit sync mechanism
     - useCacheManager loads once on mount
     - Direct musicDB calls bypass state
     - e.g., removeSong() calls musicDB.deleteSong() then state
     - Race condition possible if IndexedDB async completes after state
  ```

- **Redundancy**: 
  - useCacheManager loads songs on mount (line 21-24)
  - useDownloadOperations saves directly to musicDB
  - DownloadsContext re-reads from useCacheManager
  - No single access pattern

**Impact**: Potential data inconsistencies, ~40 lines managing sync, subtle bugs in stale state

---

#### 3. **Context Provider Nesting Depth** (MEDIUM)
**Location**: `/app/providers.tsx`
**Complexity**: MEDIUM
- **Problem**: 7 nested contexts in specific order
  ```
  QueryClientProvider
    QueueProvider
      DownloadsProvider
        OfflineProvider
          FavoritesProvider
            LocalPlaylistsProvider
              PlayerProvider
                HistoryProvider
  ```

- **Issues**:
  - Each provider loads data from storage on mount
  - Parallel loading would be faster (currently sequential)
  - Dependency issues: OfflineProvider depends on DownloadsProvider
  - Error in nested provider crashes entire tree
  - No explicit dependency declaration (implicit via hook order)

- **Redundancy**: Each context has similar patterns:
  - useEffect on mount to load from storage
  - useState for data
  - useCallback for mutations
  - Manual save on change
  - ~100-300 lines each

**Impact**: ~700 lines total provider code, hard to refactor order, initialization bottleneck

---

#### 4. **React Query Stale Times (MEDIUM)**
**Location**: `/hooks/data/queries.ts`
**Complexity**: MEDIUM
- **Problem**: Hardcoded stale times across 15+ query hooks
  ```
  album: 10 min
  playlist: 5 min
  song: 10 min
  artist: 10 min
  search: 1 min
  ```

- **Issues**:
  - No single configuration
  - Inconsistent across similar entities
  - No cache invalidation mechanism on download
  - Download happens → IndexedDB updated → React Query still has stale data for 1-10min
  - useAlbum(id) won't refetch when song in album is downloaded

- **Redundancy**: Each hook defines staleTime independently

**Impact**: ~50 lines of repeated staleTime config, stale data bug when mixing downloaded/online songs

---

#### 5. **Service Worker Caching Logic** (MEDIUM)
**Location**: `/public/sw.js`
**Complexity**: MEDIUM
- **Problem**: Multiple competing caching strategies
  - Cache-first: static assets
  - Network-first: HTML pages
  - Cache-first (then network): images
  - API routes: no caching (early return)
  
- **Issues**:
  ```
  1. Build detection (lines 21-64):
     - Checks build-info.json every 30 seconds
     - On new build detected: clears ALL caches
     - But: doesn't clear IndexedDB or localStorage
     - So: app data survives build, SW caches cleared (inconsistency)
  
  2. Eviction logic (lines 90-105):
     - Different from IndexedDB (uses oldest entries)
     - MAX_ITEMS_PER_CACHE = 100 per cache type
     - MAX_CACHE_SIZE = 500MB total (never enforced!)
     - _manageCacheSize() function defined but never called
  
  3. Fetch event routing (lines 170-297):
     - 6 different code paths
     - No clear strategy per URL pattern
     - Random deployment check (1% of requests) is unpredictable
  ```

- **Redundancy**: 
  - Eviction logic ~40 lines (unused)
  - Similar cache.put() patterns repeated 4x
  - Error handling (fallback) repeated 4x

**Impact**: ~100 lines potential dead code, inconsistent cache behavior, build detection doesn't sync with storage

---

### Medium Complexity Areas

#### 6. **Storage Abstraction Layers**
**Location**: `/lib/storage/`
**Complexity**: MEDIUM
- **Problem**: Generic StorageManager abstraction not fully used
  - musicDB = custom IDBConnection pattern (doesn't use StorageManager)
  - favoritesStorage = separate getDB() pattern
  - PlaylistsContext = direct indexedDB.open() inline
  - queueStorage = localStorage wrapper
  
- **Unused abstraction**: StorageManager has methods for:
  - idbPut, idbGet, idbGetAll (not used by musicDB)
  - localGet, localSet, localRemove (not used by context)
  - remoteFetch (not used at all)

**Impact**: ~500 lines of code doing 30% of the work, confusing for contributors

---

#### 7. **Favorites vs Downloads Duplication**
**Location**: `/contexts/favorites-context.tsx` vs downloads
**Complexity**: LOW-MEDIUM
- **Problem**: Similar patterns but separate implementations
  - Both cache songs in IndexedDB
  - Both manage state in React
  - Both have add/remove/get operations
  
- **Could consolidate**: Both are "offline accessible song collections"
  - Favorites = user-selected subset
  - Downloaded = user-downloaded subset
  - Could use unified CachedSongCollection with different sources

**Impact**: ~100 lines duplication, maintenance burden

---

#### 8. **Offline Context Logic Coupling**
**Location**: `/contexts/offline-context.tsx`
**Complexity**: MEDIUM
- **Problem**: Tight coupling to DownloadsContext
  - OfflineProvider depends on DownloadsProvider
  - Calls isSongCached(songId) for every filter
  - isOfflineMode = !isOnline (automatic, no control)
  
- **Issues**:
  - Can't manually toggle offline mode (as per line 44 comment)
  - Filter operations O(n*m) when getFilteredSongs called with large lists
  - No caching of filtered results

**Impact**: ~50 lines tightly coupled, potential performance issue at scale

---

### Lower Complexity Areas (Working Well)

- **Queue persistence**: queueStorage is simple and effective
- **LocalStorage adapters**: Clear patterns for simple key-value
- **Download operations**: Good error handling
- **React Query queries**: Well-structured, good reuse

## 6. IDENTIFIED PAIN POINTS & BUGS

### Critical Issues

1. **Race Condition in Download + Delete**
   - **Location**: `use-download-operations.ts` + `use-cache-manager.ts`
   - **Issue**: downloadSong does:
     ```
     musicDB.saveSong(song)        // async
     musicDB.saveAudioBlob(blob)   // async
     addToCache(song)              // sync state update
     musicDB.evictOldestIfNeeded() // async
     ```
   - If user deletes during download, state and IndexedDB get out of sync
   - **Fix**: Use async queue/mutex

2. **IndexedDB Connection Not Pooled**
   - **Location**: `/lib/local_db/connection.ts`
   - **Issue**: Each IDBOperation creates new connection via `open()`
   - **Fix**: Reuse single connection in IDBConnection.db

3. **Service Worker Cache Clearing Incomplete**
   - **Location**: `/public/sw.js` line 45
   - **Issue**: clearAllCaches() only clears SW caches, not IndexedDB
   - When deployment detected: SW caches cleared, but IndexedDB + localStorage persist
   - Could cause version mismatch between app code and cached data
   - **Fix**: Coordinate cache clearing via IndexedDB versioning

4. **EMPTY_BLOB Pattern Error Prone**
   - **Location**: `/hooks/data/use-cache-manager.ts` line 12
   - **Issue**: Using Blob() === EMPTY_BLOB is fragile
   - Blob size could be 0 in valid cases
   - Should use explicit flag: `{ song, blob, isLoaded: false }`
   - **Fix**: Add explicit loading state

### High Priority Issues

5. **Stale React Query Data When Downloading**
   - **Location**: `/hooks/data/queries.ts` + `use-download-operations.ts`
   - **Issue**: Download song → IndexedDB updated → useAlbum still returns old data (stale for 10min)
   - User downloads song from album view
   - Album query doesn't invalidate
   - Inconsistent state displayed
   - **Fix**: Call queryClient.invalidateQueries on download completion

6. **No Error Recovery in Context Initialization**
   - **Location**: `/contexts/` (all contexts)
   - **Issue**: Each context catches errors but silently fails
   - If favoritesStorage.getAll() fails (IndexedDB corrupted), user has empty favorites
   - No retry mechanism
   - **Fix**: Add retry logic or user-visible warning

7. **Potential Memory Leak in useServiceWorker**
   - **Location**: `/hooks/network/use-service-worker.ts` line 13-14
   - **Issue**: buildIdRef and updateIntervalRef not cleared on unmount properly
   - setInterval not cleared if component unmounts during first 60 minutes
   - **Fix**: Add proper ref cleanup

### Medium Priority Issues

8. **Inefficient useCacheManager Initialization**
   - **Location**: `/hooks/data/use-cache-manager.ts` line 21-24
   - **Issue**: Loads ALL songs on mount with Promise.all()
   - If 100 cached songs: 100 IndexedDB queries in parallel
   - Blocks app initialization
   - **Fix**: Lazy load or paginate

9. **Hard-Coded Limits Not Enforced**
   - **Location**: `/public/sw.js` lines 7-8
   - **Issue**: 
     - MAX_CACHE_SIZE = 500MB defined but never checked
     - _manageCacheSize() never called
     - MAX_ITEMS_PER_CACHE checked after each add (reactive)
   - **Fix**: Implement actual size-based eviction

10. **Unused Service Worker Cache Management Code**
    - **Location**: `/public/sw.js` lines 90-105
    - **Issue**: evictOldest() and _manageCacheSize() never called
    - evictOldest called manually at lines 209, 235, 273, 280
    - Dead code (_manageCacheSize)
    - **Fix**: Remove or properly implement

11. **Query Keys Not Invalidated on Related Updates**
    - **Location**: `/hooks/data/queries.ts`
    - **Issue**: 
      - Add to favorites → doesn't invalidate useSong()
      - Add to playlist → doesn't invalidate usePlaylist()
      - Download song → doesn't invalidate useAlbum()
    - **Fix**: Implement React Query invalidation patterns

## 7. CACHE INVALIDATION POINTS & STRATEGIES

### Current Invalidation Mechanisms

#### React Query (Automatic)
```
- Stale Time expiration (1-10 min depending on query)
- Manual: queryClient.invalidateQueries(queryKeys.album(id))
- Refetch on window focus: enabled by default
```

#### Service Worker (Manual)
```
- Deployment detection: build-info.json check
- Manual: postMessage({ type: "CLEAR_CACHE" })
- Periodic: None (build detection runs on fetch 1% rate)
```

#### IndexedDB (LRU)
```
- Automatic: evictOldestIfNeeded() on download
- Manual: musicDB.clearAll()
- Trigger: 100 songs OR 500MB limit
```

#### localStorage (Manual)
```
- Manual: clear() methods on each adapter
- Automatic: None (except queue 7-day max age)
```

### Missing Invalidation Patterns

1. **Download → Query Invalidation Gap**
   - When song downloaded, React Query still has stale useAlbum data
   - Should invalidate: useAlbum, usePlaylist, useArtist

2. **Cross-Cache Invalidation**
   - Download → clear SW image cache? No
   - Clear IndexedDB → update React Query? No
   - Add to favorites → update React Query? No

3. **Explicit Manual Invalidation**
   - Users can't force refresh
   - No "clear cache" button that clears all layers consistently
   - SW cache separate from IndexedDB separate from React Query

4. **Build Deployment Cache Busting**
   - Only SW caches cleared on deployment
   - IndexedDB/localStorage not versioned
   - Schema version exists but not enforced

### Recommended Invalidation Architecture

```
Tier 1: Immediate (React state)
  ↓
Tier 2: Query Invalidation (React Query)
  queryClient.invalidateQueries(patterns)
  ↓
Tier 3: Storage Invalidation (IndexedDB/localStorage)
  storage.bumpVersion() → force clear on next init
  ↓
Tier 4: Service Worker Invalidation
  postMessage({type: "CLEAR_CACHE"})
  
Coordinated by: CacheInvalidationService
  - Tracks what was updated
  - Cascades invalidation down layers
```

## 8. REDUNDANT PATTERNS & CONSOLIDATION OPPORTUNITIES

### Pattern 1: IndexedDB Connection Management
**Locations**: 3 patterns used
```
Pattern A (musicDB):
  class IDBConnection { private db, dbPromise; async open() }
  
Pattern B (favoritesStorage):
  function getDB() { return indexedDB.open() }
  
Pattern C (PlaylistsContext):
  async function openPlaylistsDB() { return indexedDB.open() }
  
Consolidation: Use StorageManager.idbPut/Get/GetAll
  - Single pattern
  - Migration support built-in
  - Versioning centralized
```

### Pattern 2: Storage Adapter CRUD
**Locations**: 5 adapters (favorites, queue, playlists, history, search-history)
```
Redundant in each:
  - getDB() or getStorage()
  - Error handling with try-catch
  - Type wrapping/unwrapping
  - Manual transaction handling
  
Could use: Generic StorageAdapter<T> class
  - Reusable CRUD methods
  - Centralized error handling
  - Type-safe operations
  - ~50 lines per adapter → ~20 lines
```

### Pattern 3: Context + Hook Pattern
**Locations**: 7 contexts (Downloads, Favorites, History, Playlists, Player, Queue, Offline)
```
Redundant in each:
  - useState for data
  - useEffect for initialization
  - useCallback for mutations
  - Context wrapper
  - Hook export with error checking
  
Could use: ContextFactory function
  - Generate context + hook + provider
  - Standardized error boundaries
  - ~100 lines per → ~50 lines
```

### Pattern 4: Query Stale Times
**Locations**: 15+ query hooks
```
Redundant:
  staleTime: 1000 * 60 * 10  // appears 10x
  staleTime: 1000 * 60 * 5   // appears 5x
  
Could use: queryStaleTimeConfig object
  - METADATA = 10min (albums, artists, playlists, songs)
  - SEARCH = 1min
  - Default = 60s
  - Single source of truth
```

### Pattern 5: LRU Eviction
**Locations**: 2 implementations
```
IndexedDB (SongOperations):
  Evicts oldest 10% when 100 songs reached

Service Worker (sw.js):
  Evicts oldest entries when > MAX_ITEMS

Differences:
  - Different trigger (count vs size)
  - Different algorithms
  - Different data types (IDBRecord vs Response)
  
Could consolidate: EvictionStrategy interface
  - Implement for both
  - Consistent logic
  - Easy to swap policies
```

## 9. MAINTENANCE CHALLENGES

### Current Maintenance Burdens

1. **Multiple Source of Truths**
   - Song data exists in:
     - IndexedDB (source)
     - In-memory Map (cache)
     - React Query (cache)
     - Service Worker (static HTML references)
   - When to update which?
   - Where does user see it first?

2. **Versioning Coordination**
   - STORAGE_VERSION in config.ts
   - IndexedDB VERSION fields (v1, v3, v1)
   - Service Worker version in sw.js (v1)
   - Build-info.json for deployments
   - No single version source

3. **Error Handling Inconsistency**
   - musicDB: throws and logs
   - contexts: catch and silently fail
   - storage adapters: try-catch with empty fallback
   - React Query: error states, no retry
   - No error boundary for storage layer

4. **Testing Challenges**
   - IndexedDB hard to mock (3 separate instances)
   - React Query cache needs reset between tests
   - Context nesting 7 deep (hard to test in isolation)
   - Service Worker needs separate test environment
   - No integration tests

5. **Debugging Difficulties**
   - Data in 5 different places
   - No inspection tools for cross-layer state
   - Async operations make timing bugs hard to reproduce
   - No audit log of cache operations

### Recommended Improvements

1. **Cache Coherency Layer**
   ```
   CacheCoherence {
     onSongDownloaded(songId)
       → invalidateQueries([album, artist, playlist])
       → updateServiceWorkerCache(songId)
     
     onSongDeleted(songId)
       → invalidateQueries(...)
       → clearFromAllLayers(songId)
     
     onDeployment()
       → clearAllCaches()
       → resetVersions()
  ```

2. **Unified Storage Manager**
   - Replace 3 IndexedDB patterns with one
   - Use StorageManager for all storage ops
   - Single version management
   - Centralized migration

3. **Explicit Cache Layer API**
   ```
   // Instead of direct musicDB/favoritesStorage/queueStorage calls
   // Use unified API
   
   cacheAPI.get(CacheLayer.IndexedDB, "songs", songId)
   cacheAPI.put(CacheLayer.IndexedDB, "songs", songId, data)
   cacheAPI.invalidate(CacheLayer.QueryCache, queryKeys.album(id))
   ```

4. **Error Boundary for Storage**
   - Catch storage errors at app level
   - Show degraded UI (data not available)
   - Retry with exponential backoff
   - User notification for cache issues

5. **Cache Inspection DevTools**
   - Browser extension showing all cache layers
   - Live view of React Query cache
   - IndexedDB inspector
   - Service Worker cache status
   - Ability to clear individual layers

## 10. SUMMARY TABLE

| Aspect | Status | Complexity | Tech Debt |
|--------|--------|-----------|-----------|
| Service Worker Caching | Working | Medium | Dead code, incomplete build detection |
| React Query Caching | Working | Low | Missing invalidation patterns |
| IndexedDB Layer | Working | High | 3 separate instances, inconsistent patterns |
| localStorage Layer | Working | Low | Simple but fragmented adapters |
| In-Memory State Cache | Working | High | Sync issues, lazy loading fragile |
| Context Providers | Working | Medium | Deep nesting, sequential init |
| Offline Support | Working | Medium | Tight coupling, O(n*m) filtering |
| **TOTAL** | **Functional** | **~450 lines of boilerplate** | **~200 lines tech debt** |

## 11. RECOMMENDED ACTION PLAN

### Phase 1: Immediate (Critical Fixes)
1. Add React Query invalidation on download (30 min)
2. Fix race condition in download/delete (1 hr)
3. Remove unused SW code (_manageCacheSize) (15 min)

### Phase 2: Short-term (1-2 weeks)
1. Consolidate to single IndexedDB connection pattern (2 hrs)
2. Add sync mechanism between in-memory cache and IndexedDB (3 hrs)
3. Implement cache invalidation coordinator (2 hrs)

### Phase 3: Medium-term (2-4 weeks)
1. Unified StorageManager adoption (3 hrs)
2. Generic StorageAdapter for all contexts (2 hrs)
3. Fix Service Worker build detection to clear all layers (1 hr)

### Phase 4: Long-term (Refactoring)
1. Create cache inspection DevTools
2. Add integration tests for cache coherency
3. Extract CacheAPI as separate module
4. Performance optimization: lazy-load useCacheManager

## 12. PRIORITY FIXES

**HIGH**: 
- Query invalidation on download
- Race condition in download/delete
- Service Worker cache clearing

**MEDIUM**:
- Consolidate IndexedDB patterns
- Memory leak in useServiceWorker
- Stale query data

**LOW**:
- Remove dead code
- Generic storage adapters
- Context factory pattern
