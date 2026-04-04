# Hook Optimization Checklist

## Overview
This checklist breaks down the comprehensive hook analysis into actionable items organized by priority and estimated effort.

**Total Estimated Time:** 1 week
**Estimated LOC Reduction:** 400-500 lines (12-15%)

---

## PHASE 1: Quick Wins (Day 1) - 2-3 hours

### 1.1 Consolidate Network Detection
- **Current:** 2 nearly identical hooks (82 LOC total)
  - `hooks/network/use-network-detection.ts` (52 LOC)
  - `hooks/cache/use-offline.ts` (30 LOC)
- **Target:** 1 unified hook (35-40 LOC)
- **Actions:**
  - [ ] Create `hooks/network/use-online-status.ts`
  - [ ] Implement single source of truth for online/offline detection
  - [ ] Add toast notifications for state changes
  - [ ] Create backward-compatible re-exports:
    - [ ] `export const useNetworkDetection = () => ({ isOnline: useOnlineStatus() })`
    - [ ] `export const useOffline = () => !useOnlineStatus()`
  - [ ] Update imports in components using old hooks
  - [ ] Delete old hooks
- **LOC Saved:** ~45
- **Files to Modify:** 5-10 component files

### 1.2 Remove `useAnimationPreferences`
- **Current:** 15 LOC wrapper around `motion/react`
- **Target:** Use `motion/react` directly in components
- **Actions:**
  - [ ] Find all usages of `useAnimationPreferences`
  - [ ] Replace with direct `useReducedMotion()` import
  - [ ] Delete `hooks/ui/use-animation-preferences.ts`
  - [ ] Update barrel exports in `hooks/ui/index.ts`
- **LOC Saved:** 15
- **Files to Modify:** 3-5 component files

### 1.3 Move `usePerformanceMonitor` to Dev Tools
- **Current:** 114 LOC in `hooks/ui/`
- **Target:** Move to `lib/dev-tools/` (dev-only export)
- **Actions:**
  - [ ] Create `lib/dev-tools/use-performance-monitor.ts`
  - [ ] Move both `usePerformanceMonitor` and `useMountTiming`
  - [ ] Conditionally export only in development:
    ```typescript
    // lib/dev-tools/index.ts
    export const usePerformanceMonitor = process.env.NODE_ENV === 'development'
      ? require('./use-performance-monitor').usePerformanceMonitor
      : () => ({ getMetrics: () => ({}) });
    ```
  - [ ] Update imports from `hooks/ui/` to `lib/dev-tools/`
  - [ ] Delete from `hooks/ui/`
- **LOC Saved:** 114 (from main hooks bundle)
- **Files to Modify:** 3-4 component files

### 1.4 Add Prefetch Hooks
- **Current:** 0 prefetch hooks
- **Target:** 5 prefetch hooks for common queries
- **Actions:**
  - [ ] Create `hooks/data/prefetch.ts` with:
    - [ ] `usePrefetchSong(id)`
    - [ ] `usePrefetchAlbum(id)`
    - [ ] `usePrefetchArtist(id)`
    - [ ] `usePrefetchSongSuggestions(id)`
    - [ ] `usePrefetchSearchResults(query)`
  - [ ] Add barrel export in `hooks/data/index.ts`
  - [ ] Document usage in components
- **LOC Added:** ~80
- **UX Benefit:** Eager data loading on hover/focus
- **Files to Create:** 1

**Phase 1 Total: 50-60 LOC saved, ~200-300 LOC optimized for UX**

---

## PHASE 2: Major Refactor (Days 2-3) - 6-8 hours

### 2.1 Create Query Hook Factory
- **Current:** 304 LOC in `queries.ts` with 60% boilerplate
- **Target:** 120-140 LOC with factory pattern
- **Actions:**
  - [ ] Create `lib/api/factory.ts`:
    ```typescript
    // Define createQueryHook<T, P>() factory
    // Define createMutationHook<T, P>() factory
    // Add TypeScript overloads for optional parameters
    ```
  - [ ] Refactor `hooks/data/queries.ts`:
    - [ ] Replace `useSong()`, `useAlbum()`, etc. with factory calls
    - [ ] Reduce from 304 → ~120 LOC
  - [ ] Test all query hooks still work identically
  - [ ] Update types/exports
- **LOC Saved:** ~180 (60% reduction)
- **Impact:** Much easier to add new queries
- **Files to Modify:** 2
- **Files to Create:** 1

### 2.2 Remove `pages/` Category (Thin Wrappers)
- **Current:** 4 hooks (48 LOC)
  - `useSongFromQuery()` - wraps `useSong()` + `useQueryState`
  - `useAlbumFromQuery()` - wraps `useAlbum()` + `useQueryState`
  - `useArtistFromQuery()` - wraps `useArtist()` + `useQueryState`
  - `usePlaylistFromQuery()` - wraps `usePlaylist()` + `useQueryState`
- **Target:** Move logic into `hooks/data/` or components
- **Actions:**
  - [ ] Move to `hooks/data/use-entity-query.ts`:
    ```typescript
    // Export all 4 as variants in data/
    export const useSongFromQuery = () => { ... }
    export const useAlbumFromQuery = () => { ... }
    // etc.
    ```
  - [ ] Update imports in components/pages
  - [ ] Delete `hooks/pages/` directory
  - [ ] Remove from barrel exports
- **LOC Saved:** 48
- **Files to Modify:** 5-10 component files

### 2.3 Merge `playback/` into `player/`
- **Current:** 2 separate categories
  - `hooks/playback/` (95 LOC): playback speed, sleep timer
  - `hooks/player/` (189 LOC): player actions, offline player
- **Target:** Single `hooks/player/` with 4-5 focused hooks
- **Actions:**
  - [ ] Move `use-playback-speed.ts` → `hooks/player/`
  - [ ] Move `use-sleep-timer.ts` → `hooks/player/`
  - [ ] Create `hooks/player/index.ts` barrel export for all 5 hooks
  - [ ] Update imports in components
  - [ ] Delete `hooks/playback/` directory
- **LOC Saved:** 0 (reorganization only, 92 LOC consolidated)
- **Files to Modify:** 5-10 component files

### 2.4 Create `storage/` Category
- **Current:** Scattered across categories
  - `hooks/cache/use-offline.ts` (30 LOC) → should be network/
  - `hooks/cache/use-cache.ts` (78 LOC)
  - `hooks/cache/use-download-song.ts` (79 LOC)
  - `hooks/data/use-device-downloads.ts` (194 LOC)
- **Target:** Unified `hooks/storage/` category
- **Actions:**
  - [ ] Create `hooks/storage/` directory
  - [ ] Move 4 hooks into it
  - [ ] Create `hooks/storage/index.ts` with barrel export
  - [ ] Update imports in components (cache/ → storage/)
  - [ ] Remove `hooks/cache/` directory
  - [ ] Add comment documenting this category:
    ```typescript
    // Storage layer: IndexedDB, device downloads, persistent state
    ```
- **LOC Saved:** 0 (reorganization only)
- **Better Structure:** Related concerns now together
- **Files to Modify:** 10-15 component files

**Phase 2 Total: 280+ LOC refactored/removed**

---

## PHASE 3: Advanced Features (Days 4-5) - 6 hours

### 3.1 Enable Stale-While-Revalidate (SWWR)
- **Current:** `refetchOnWindowFocus: false` (disabled)
- **Target:** Enable SWWR for better UX
- **Actions:**
  - [ ] Update `lib/api/create-query.ts`:
    ```typescript
    export const QUERY_PRESETS = {
      metadata: {
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: true,      // ← Enable
        refetchOnReconnect: true,         // ← Add for offline recovery
      },
    };
    ```
  - [ ] Test SWWR behavior with slow network
  - [ ] Verify no excessive refetches
  - [ ] Document in code comments
- **UX Benefit:** Stale data shows immediately, fresh data loads in background
- **Files to Modify:** 1

### 3.2 Add `keepPreviousData` to Search
- **Current:** Search results flicker when query changes
- **Target:** Show previous results while loading new ones
- **Actions:**
  - [ ] Update `useSearchSongs()`:
    ```typescript
    placeholderData: keepPreviousData,
    ```
  - [ ] Update `useSearchAlbums()`, `useSearchArtists()`, `useSearchPlaylists()`
  - [ ] Test UX with slow network
- **UX Benefit:** Smoother search experience
- **Files to Modify:** 1

### 3.3 Refactor Search Suggestions to Use React Query
- **Current:** Manual debouncing with `setTimeout`
- **Target:** Use React Query's request deduplication
- **Actions:**
  - [ ] Rewrite `hooks/search/use-search-suggestions.ts`:
    ```typescript
    export function useSearchSuggestions(query: string) {
      return useQuery({
        queryKey: ["search-suggestions", query],
        queryFn: async () => {
          if (query.length < 2) return [];
          const results = await searchMusic(query);
          return results.data.topQuery.results.slice(0, 5);
        },
        enabled: query.length > 2,
        staleTime: CACHE_TIMES.SUGGESTIONS,
        retry: 1,
      });
    }
    ```
  - [ ] Remove manual `useEffect` with `setTimeout`
  - [ ] React Query handles debouncing via request deduplication
  - [ ] Remove `AbortController` manual management
  - [ ] Simplify from ~51 LOC → ~20 LOC
- **LOC Saved:** ~30
- **Benefit:** Simpler, more robust, automatic debouncing
- **Files to Modify:** 1

### 3.4 Add Mutation Hooks
- **Current:** Mutations scattered in components
- **Target:** Centralized `hooks/data/mutations.ts`
- **Actions:**
  - [ ] Create `hooks/data/mutations.ts` with:
    - [ ] `useAddFavorite()`
    - [ ] `useRemoveFavorite()`
    - [ ] `useToggleFavorite()`
    - [ ] `useCreatePlaylist()`
    - [ ] `useUpdatePlaylist()`
    - [ ] `useDeletePlaylist()`
  - [ ] Add optimistic updates (if applicable)
  - [ ] Add error handling with toast notifications
  - [ ] Add invalidation patterns
  - [ ] Export from `hooks/data/index.ts`
- **LOC Added:** ~150-200 (but consolidates scattered code)
- **Benefit:** Consistent mutations, invalidation strategy
- **Files to Create:** 1

**Phase 3 Total: 30+ LOC removed, major UX improvements**

---

## PHASE 4: Cleanup & Testing (Days 5-6) - 4 hours

### 4.1 Update Documentation
- [ ] Update `README.md` with new hook structure
- [ ] Document `hooks/` folder organization (6 categories)
- [ ] Add examples for `useQuery` factory pattern
- [ ] Add examples for prefetch hooks
- [ ] Update `AGENTS.md` hook guidelines
- [ ] Document storage layer organization

### 4.2 Update Barrel Exports
- [ ] Create/update `hooks/data/index.ts` (queries + prefetch + mutations)
- [ ] Create/update `hooks/player/index.ts` (all 5 hooks)
- [ ] Create/update `hooks/storage/index.ts` (4 hooks)
- [ ] Create/update `hooks/network/index.ts` (3 hooks)
- [ ] Update main `hooks/index.ts` with all categories
- [ ] Verify no circular imports

### 4.3 Run Test Suite
- [ ] `npm run build` (TypeScript check)
- [ ] `npm run lint` (Biome checks)
- [ ] `npm run format` (Code format)
- [ ] Verify no import errors
- [ ] Manual testing in app

### 4.4 Update Imports
- [ ] Update all component imports to use new paths
- [ ] Use find-replace for bulk updates:
  - [ ] `from "@/hooks/pages/` → `from "@/hooks/data/`
  - [ ] `from "@/hooks/playback/` → `from "@/hooks/player/`
  - [ ] `from "@/hooks/cache/` → `from "@/hooks/storage/`
  - [ ] `from "@/hooks/network/use-offline` → `from "@/hooks/network/`
  - [ ] `from "@/hooks/ui/use-animation-preferences` → `from "motion/react"`

### 4.5 Verify Performance
- [ ] Bundle size analysis: `npm run analyze`
- [ ] Verify no increase in bundle size
- [ ] Check hook re-render counts (usePerformanceMonitor in dev)
- [ ] Verify cache hit rates with DevTools

**Phase 4 Total: Documentation, cleanup, verification**

---

## METRICS TRACKING

### Before Optimization
```
Total Hooks:              39
Hook Categories:          10
hooks/ LOC:               3,371
queries.ts LOC:           304
Network Detection:        2 hooks (82 LOC)
UI Wrappers:              10 hooks
Query Boilerplate:        28 useQuery calls (90% identical)
Prefetch Hooks:           0
Mutations:                Scattered in components
```

### After Optimization
```
Total Hooks:              28-32
Hook Categories:          6
hooks/ LOC:               2,800-3,000
queries.ts LOC:           ~120
Network Detection:        1 hook (35-40 LOC)
UI Wrappers:              6-7 hooks
Query Boilerplate:        8-10 useQuery calls
Prefetch Hooks:           5
Mutations:                Centralized (mutations.ts)
```

### Target Improvements
- Hook count reduction: 28-28% (39 → 32)
- Category consolidation: 40% (10 → 6)
- LOC reduction: 12-15% (3,371 → 2,900)
- Boilerplate reduction: 60% (304 LOC → 120)
- React Query feature adoption: 40% → 90%

---

## DEPENDENCY UPDATES NEEDED
None! Your current dependencies are good:
- React Query 6.x ✅
- Zustand ✅
- TypeScript 5.x ✅

---

## ROLLBACK PLAN
If something breaks during refactoring:
1. Commit current state before each phase
2. Use git to revert problematic commits
3. Test incrementally after each phase
4. Don't combine multiple phases in one commit

---

## SIGN-OFF

- [ ] Phase 1 Complete (Quick Wins)
- [ ] Phase 2 Complete (Major Refactor)
- [ ] Phase 3 Complete (Advanced Features)
- [ ] Phase 4 Complete (Cleanup & Testing)

**Final Verification:**
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] No TypeScript errors
- [ ] All tests pass
- [ ] Manual testing in browser
- [ ] Performance metrics verified

---

## RELATED DOCUMENTS
- `HOOK_ANALYSIS.md` - Detailed analysis with code examples
- `HOOK_ANALYSIS_SUMMARY.txt` - Executive summary with metrics

