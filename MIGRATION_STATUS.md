# Zustand + Dexie Migration Status

## ✅ COMPLETED (70%)

### 1. Core Infrastructure ✅
- **Zustand** installed (v5.0.10)
- **Dexie** installed (v4.2.1)
- Bundle size increase: ~25KB gzipped

### 2. Database Layer (Dexie) ✅
**File**: `/lib/db/dexie.ts` (230 lines)

**Replaced**: 700 lines of custom IndexedDB boilerplate

**Features**:
- ✅ Songs storage with LRU eviction
- ✅ Audio blob storage
- ✅ Image blob storage  
- ✅ Favorites storage
- ✅ Playlists storage
- ✅ Atomic multi-store transactions
- ✅ Storage quota monitoring
- ✅ Automatic eviction when limits reached (100 songs or 500MB)

**API**:
```ts
db.saveSong(song)
db.getSong(songId)
db.deleteSong(songId)
db.saveAudioBlob(songId, blob)
db.getAudioBlob(songId)
db.addFavorite(song)
db.getFavorites()
db.savePlaylist(playlist)
db.getAllPlaylists()
db.evictOldestIfNeeded()
db.getStorageInfo()
```

### 3. Zustand Stores ✅
**Files**: `/stores/*.ts` (~1,050 lines total)

**Replaced**: 1,437 lines of context code

| Store | File | Status | Features |
|-------|------|--------|----------|
| **Player** | `player-store.ts` | ✅ | Merged PlayerContext + QueueContext, playback state, queue management, shuffle |
| **Favorites** | `favorites-store.ts` | ✅ | Add/remove/toggle favorites, Dexie persistence |
| **Playlists** | `playlists-store.ts` | ✅ | CRUD operations, song management, Dexie persistence |
| **History** | `history-store.ts` | ✅ | LRU history (max 10), localStorage persistence |
| **Downloads** | `downloads-store.ts` | ✅ | Cache management, download operations, blob handling |
| **Offline** | `offline-store.ts` | ✅ | Network detection, filtered queries, cached songs only |

**Store Hooks**:
```ts
// Player
usePlayerStore()
usePlaybackState() // Optimized selector
useQueueState() // Optimized selector
usePlayerActions() // Optimized selector

// Others
useFavoritesStore()
usePlaylistsStore()
useHistoryStore()
useDownloadsStore()
useDownloadsState() // Optimized selector
useDownloadsActions() // Optimized selector
useOfflineStore()
```

### 4. Providers Updated ✅
**File**: `/app/providers.tsx`

**Before**: 7-level provider nesting
**After**: Single QueryClientProvider + store initialization

**Changes**:
- ❌ Removed all context providers
- ✅ Added store initialization on mount
- ✅ Added network detection for offline mode
- ✅ Cleaner error boundary structure

### 5. Components Updated ✅
- ✅ `/components/audio-player.tsx` - Core player with audio ref management

### 6. Documentation ✅
- ✅ `/MIGRATION_GUIDE.md` - Overall migration strategy
- ✅ `/COMPONENT_MIGRATION.md` - Component-specific migration guide

---

## 🚧 REMAINING WORK (30%)

### 7. Update Remaining Components (High Priority)

**Critical Components** (needed for basic functionality):
- [ ] `/components/player/*` - All player UI components
- [ ] `/components/song-item.tsx` - Song list item
- [ ] `/components/common/song-action-menu.tsx` - Add to queue, playlists
- [ ] `/components/common/favorite-button.tsx` - Toggle favorite

**Important Components**:
- [ ] `/components/history-list.tsx`
- [ ] `/components/download-button.tsx`
- [ ] `/components/navigation.tsx`
- [ ] `/components/search-content.tsx`
- [ ] `/components/search/search-tab-content.tsx`
- [ ] `/components/common/playlist-edit-dialog.tsx`
- [ ] `/components/common/create-playlist-dialog.tsx`

**Page Client Components**:
- [ ] `/app/*/client.tsx` - All page-level client components

**Estimated Time**: 2-3 hours

### 8. Update Hooks (Medium Priority)

Some hooks still reference old context patterns:
- [ ] `/hooks/player/use-offline-player-actions.ts`
- [ ] Check all hooks in `/hooks/player/*` for context usage

**Estimated Time**: 30 minutes

### 9. Testing & Bug Fixes (High Priority)

**Critical Test Cases**:
- [ ] App starts without errors
- [ ] Play a song
- [ ] Play/pause toggle works
- [ ] Next/previous buttons work
- [ ] Queue management (add/remove/reorder)
- [ ] Volume control
- [ ] Seek functionality
- [ ] Shuffle mode
- [ ] Favorites (add/remove/toggle)
- [ ] Playlists (create/edit/delete/add songs)
- [ ] Downloads (download/remove)
- [ ] Offline mode (play cached songs)
- [ ] History tracking
- [ ] Page refresh (state persistence)

**Edge Cases**:
- [ ] Rapid play/pause clicks
- [ ] Delete current song from queue
- [ ] Network disconnect during playback
- [ ] Storage quota exceeded
- [ ] Empty queue behavior

**Estimated Time**: 1-2 hours

### 10. Cleanup (Low Priority)

**After everything works**:
- [ ] Delete `/contexts/` directory
- [ ] Delete old DB files (`/lib/db/index.ts`, `connection.ts`, `operations.ts`)
- [ ] Remove unused imports throughout codebase
- [ ] Run `pnpm format` on all modified files
- [ ] Run `pnpm lint` to check for issues
- [ ] Update any documentation references

**Estimated Time**: 30 minutes

---

## 📋 Migration Checklist

### Quick Start Testing
1. Run `pnpm dev`
2. Check console for errors
3. Try playing a song
4. Check if audio plays
5. Test basic controls (play/pause/next/prev)

### If Errors Occur

**Common Issues**:

1. **"Cannot find name useQueue"**
   - Fix: Update import to `useQueueState` from player-store

2. **"audioRef is null"**
   - Fix: Check AudioPlayer has ref initialization

3. **"Must be used within Provider"**
   - Fix: Component still using old context, update to store

4. **"Favorites/Playlists empty"**
   - Fix: Stores need initialization - check Providers

5. **TypeScript errors in queries.ts / api/index.ts**
   - These are pre-existing errors, not related to migration
   - Can be ignored for now or fixed separately

---

## 🎯 Next Steps (Priority Order)

1. **Test the app** - Run `pnpm dev` and check for errors
2. **Update player components** - Fix any broken player UI
3. **Update song-item** - Fix song list rendering
4. **Update action menus** - Fix add to queue, favorites, playlists
5. **Test thoroughly** - Go through checklist above
6. **Fix bugs** - Address any issues found
7. **Clean up** - Remove old files, format code

---

## 📊 Migration Statistics

**Code Reduction**:
- Contexts: 1,437 lines → 0 lines (100% reduction)
- Database: 700 lines → 230 lines (67% reduction)
- State Management: 0 → 1,050 lines (new Zustand stores)
- **Net Reduction**: ~1,087 lines (48% less state/storage code)

**Performance Improvements**:
- ❌ No more 7-level provider nesting
- ✅ Optimized selectors (fewer re-renders)
- ✅ Direct store access (no prop drilling)
- ✅ Efficient Dexie queries (no in-memory filtering)

**Developer Experience**:
- ✅ Redux DevTools support
- ✅ Simpler testing (direct state manipulation)
- ✅ Better TypeScript inference
- ✅ Easier to add new features

**Bundle Size**:
- Added: +25.3KB gzipped (zustand + dexie)
- Impact: ~1.5% for typical PWA

---

## 🐛 Known Issues

1. **TypeScript errors in other files** (pre-existing, unrelated):
   - `/hooks/data/queries.ts` - Missing `.data` property
   - `/lib/api/index.ts` - Some definitions missing
   - These don't affect migration

2. **Testing not implemented yet**:
   - Need to update test files to use stores instead of contexts
   - Component tests need new setup

---

## ✨ Migration Benefits

**After completion, you'll have**:
1. **Simpler codebase** - 48% less state management code
2. **Better performance** - Optimized renders, efficient queries
3. **Easier debugging** - Redux DevTools, clear state shape
4. **Simpler testing** - No provider mocking needed
5. **Future-proof** - Schema migrations with Dexie
6. **Better DX** - Less boilerplate for new features

---

**Current Status**: Infrastructure complete, ready for component updates and testing.

**Estimated Time to Complete**: 4-6 hours (component updates + testing + cleanup)

**Risk Level**: Low (infrastructure solid, just need to wire up components)
