# Caching Refactor - Implementation Checklist

## Pre-Implementation ✅

- [ ] Review `CACHING_REFACTOR_PLAN.md` (main document)
- [ ] Review `CACHING_REFACTOR_QUICK.md` (summary)
- [ ] Run current tests: `pnpm test` 
- [ ] Verify current build: `pnpm build`
- [ ] Create feature branch: `git checkout -b refactor/caching`
- [ ] Commit current state: `git add . && git commit -m "baseline: before caching refactor"`

---

## Phase 1: Foundation (3 days)

### Day 1: Setup & Constants

- [ ] Create `lib/cache/` directory
- [ ] Create `lib/cache/constants.ts` with:
  - [ ] `CACHE_KEYS` object
  - [ ] `CACHE_TIMES` object  
  - [ ] `STORAGE_KEYS` object
  - [ ] Type exports
- [ ] Create `lib/cache/index.ts` with public exports
- [ ] Write unit tests for constants
- [ ] Commit: `git commit -m "feat: cache constants and configuration"`

**Validation**:
```bash
pnpm lint
# Should pass with new constants
```

### Day 2: Cache Manager Implementation

- [ ] Create `lib/cache/manager.ts` with:
  - [ ] `CacheManager` class
  - [ ] `get<T>()` method (Query + IDB)
  - [ ] `set<T>()` method with TTL
  - [ ] `invalidate()` method
  - [ ] `subscribe()` method
  - [ ] `clear()` method
  - [ ] Private IDB helpers
  - [ ] Singleton export
- [ ] Write unit tests:
  - [ ] `test("get returns null when not cached")`
  - [ ] `test("set stores in Query cache")`
  - [ ] `test("set stores in IndexedDB")`
  - [ ] `test("invalidate clears Query cache")`
  - [ ] `test("TTL expiration works")`
- [ ] Verify no console errors
- [ ] Commit: `git commit -m "feat: cache manager core logic"`

**Validation**:
```bash
pnpm lint
pnpm test lib/cache/manager.test.ts
# All tests pass
```

### Day 3: Cache Hooks

- [ ] Create `hooks/cache/` directory
- [ ] Create `hooks/cache/use-cache.ts`:
  - [ ] Universal hook wrapping useQuery
  - [ ] Auto-cache behavior
  - [ ] Type safety
  - [ ] Export types
- [ ] Create `hooks/cache/use-offline.ts`:
  - [ ] Network detection with native events
  - [ ] Downloaded songs extraction from Query
  - [ ] Helper methods
- [ ] Create `hooks/cache/index.ts` with exports
- [ ] Write tests:
  - [ ] `test("useCache returns cached data")`
  - [ ] `test("useCache makes query")`
  - [ ] `test("useOffline detects online/offline")`
- [ ] Commit: `git commit -m "feat: cache hooks implementation"`

**Validation**:
```bash
pnpm lint
pnpm test hooks/cache/
# All tests pass, no unused imports
```

### Phase 1 Complete Checklist

- [ ] No build errors: `pnpm build` succeeds
- [ ] No lint errors: `pnpm lint` passes
- [ ] Tests passing: `pnpm test` green
- [ ] New code has JSDoc comments
- [ ] TypeScript strict mode happy
- [ ] Exports documented in index.ts
- [ ] No breaking changes yet (old code still works)

**Commit**: `git commit -m "phase-1: cache foundation complete"`

---

## Phase 2: Query Migration (4 days)

### Day 1: Audit & Planning

- [ ] List all current API calls used in components
- [ ] Create mapping: "old hook → new useQuery"
- [ ] Identify all custom caching logic
- [ ] Document existing cache strategies
- [ ] Plan migration order (high-use first)
- [ ] Commit: `git commit -m "docs: cache migration audit"`

### Day 2-3: Migrate Query Hooks

For each API call (start with most-used):

- [ ] Create new `useQuery` hook
- [ ] Add proper query key
- [ ] Set staleTime & gcTime
- [ ] Update component imports
- [ ] Remove old cache manager calls
- [ ] Test in component
- [ ] Commit: `git commit -m "refactor: migrate [feature] to Query"`

**Example migration**:
```typescript
// BEFORE
import { useCacheManager } from "@/hooks/data/use-cache-manager";
const cacheManager = useCacheManager();
const songs = cacheManager.cachedSongs;

// AFTER
import { useQuery } from "@tanstack/react-query";
const { data: songs } = useQuery({
  queryKey: ["songs"],
  queryFn: fetchSongs,
  staleTime: CACHE_TIMES.METADATA,
});
```

### Day 4: Context Replacement

- [ ] Remove `useDownloadsState()` calls, use Query instead
- [ ] Remove `useDownloadsActions()` calls, use Query instead  
- [ ] Remove `useOffline()` calls, use new hook
- [ ] Update all components using these contexts
- [ ] Test full app flow
- [ ] Commit: `git commit -m "refactor: replace contexts with Query hooks"`

**Validation**:
```bash
grep -r "useDownloadsState\|useDownloadsActions\|DownloadsProvider" src/
# Should return 0 results (all removed)
```

### Phase 2 Complete Checklist

- [ ] No DownloadsProvider in app.tsx
- [ ] No OfflineProvider in app.tsx
- [ ] All data fetches use useQuery
- [ ] All components updated
- [ ] Tests still pass
- [ ] App functionality unchanged
- [ ] Offline mode still works

**Commit**: `git commit -m "phase-2: query migration complete"`

---

## Phase 3: Downloads & Offline (3 days)

### Day 1: Download Flow

- [ ] Create `hooks/cache/use-download-song.ts`:
  - [ ] useMutation implementation
  - [ ] Fetch audio blob
  - [ ] Fetch images parallel
  - [ ] Cache via cacheManager
  - [ ] Error handling & retry
  - [ ] Toast notifications
- [ ] Write tests:
  - [ ] `test("download succeeds")`
  - [ ] `test("download retries 3 times")`
  - [ ] `test("images download in parallel")`
  - [ ] `test("cache stored correctly")`
- [ ] Update components using download
- [ ] Commit: `git commit -m "feat: download-song mutation"`

**Validation**:
```bash
pnpm test hooks/cache/use-download-song
# All tests pass
```

### Day 2: Offline Songs

- [ ] Create `hooks/cache/use-offline-songs.ts`:
  - [ ] Get downloaded songs from Query cache
  - [ ] Filter logic
  - [ ] Helper methods
- [ ] Write tests:
  - [ ] `test("returns downloaded songs"`
  - [ ] `test("filters correctly offline")`
- [ ] Update offline UI components
- [ ] Test offline playback manually
- [ ] Commit: `git commit -m "feat: offline-songs hook"`

### Day 3: Integration & Removal

- [ ] Remove old download hooks:
  - [ ] `hooks/storage/use-download-operations.ts`
  - [ ] `hooks/downloads/use-download-progress.ts`
  - [ ] `hooks/downloads/use-download-retry.ts`
- [ ] Remove `useDeviceStorage` hook
- [ ] Remove download-related context code
- [ ] Test download flow end-to-end
- [ ] Test offline mode end-to-end
- [ ] Commit: `git commit -m "refactor: remove old download hooks"`

### Phase 3 Complete Checklist

- [ ] Download feature works
- [ ] Downloads persist offline
- [ ] Can play offline songs
- [ ] Offline mode UI correct
- [ ] No old download code remaining
- [ ] Tests pass
- [ ] No lint errors

**Commit**: `git commit -m "phase-3: downloads & offline complete"`

---

## Phase 4: Cleanup & Deletion (2 days)

### Day 1: Verification Before Delete

Run these checks multiple times:

- [ ] Grep for old API usage:
```bash
grep -r "useCacheManager\|DownloadsProvider\|OfflineProvider" src/
# Must return 0 results
```

- [ ] Grep for removed contexts:
```bash
grep -r "from.*contexts/downloads\|from.*contexts/offline" src/
# Must return 0 results
```

- [ ] Grep for removed hooks:
```bash
grep -r "from.*hooks/data/use-cache-manager\|from.*hooks/storage\|from.*hooks/downloads" src/
# Must return 0 results
```

- [ ] Full build succeeds:
```bash
pnpm build
# No errors
```

- [ ] All tests pass:
```bash
pnpm test
# 100% pass rate
```

- [ ] Lint passes:
```bash
pnpm lint
# No issues
```

### Day 2: Delete Old Code

**BACKUP FIRST** (just in case):
```bash
git checkout -b backup/old-storage-backup
git checkout refactor/caching
```

Now delete:

- [ ] `lib/storage/` directory (entire folder)
  ```bash
  rm -rf lib/storage
  ```

- [ ] `hooks/data/use-cache-manager.ts`
  ```bash
  rm hooks/data/use-cache-manager.ts
  ```

- [ ] `hooks/storage/` directory
  ```bash
  rm -rf hooks/storage
  ```

- [ ] `hooks/downloads/` directory
  ```bash
  rm -rf hooks/downloads
  ```

- [ ] `contexts/downloads-context.tsx`
  ```bash
  rm contexts/downloads-context.tsx
  ```

- [ ] `contexts/offline-context.tsx`
  ```bash
  rm contexts/offline-context.tsx
  ```

**After deletion, verify**:
```bash
pnpm lint        # 0 errors
pnpm build       # Success
pnpm test        # All pass
```

Final verification - no unused imports:
```bash
grep -r "from.*lib/storage\|useDownloads\|useOffline\|useCacheManager" src/
# Must return 0 results
```

- [ ] Commit deletion:
```bash
git add -A
git commit -m "chore: delete old caching code"
```

### Phase 4 Complete Checklist

- [ ] Old code completely deleted
- [ ] No import references to old code
- [ ] Build succeeds
- [ ] Tests pass  
- [ ] Lint passes
- [ ] Bundle size reduced (verify with `ANALYZE=true pnpm build`)
- [ ] App still works

**Commit**: `git commit -m "phase-4: cleanup complete - old code removed"`

---

## Phase 5: Testing & Documentation (2 days)

### Day 1: Comprehensive Testing

- [ ] Add unit tests (20+):
  - [ ] Cache manager operations
  - [ ] TTL expiration
  - [ ] Offline detection
  - [ ] Download flow
  - [ ] Error handling

- [ ] Add integration tests (10+):
  - [ ] Full download → offline play flow
  - [ ] Network detection edge cases
  - [ ] Cache invalidation patterns
  - [ ] Multiple concurrent operations

- [ ] Manual testing checklist:
  - [ ] Download song → available offline ✓
  - [ ] Go offline → can still play ✓
  - [ ] Go online → syncs correctly ✓
  - [ ] Download retries on failure ✓
  - [ ] Cache hits reduce API calls ✓
  - [ ] Query DevTools shows all queries ✓

- [ ] Run full suite:
```bash
pnpm test --coverage
# Aim for 95%+ coverage on cache code
```

- [ ] Commit:
```bash
git commit -m "test: comprehensive test coverage"
```

### Day 2: Documentation

- [ ] Create `docs/CACHE_USAGE.md`:
  - [ ] How to use `useCache`
  - [ ] How to use `useDownloadSong`
  - [ ] How to use `useOffline`
  - [ ] Code examples

- [ ] Create `docs/CACHE_TROUBLESHOOTING.md`:
  - [ ] Common issues
  - [ ] Debug commands
  - [ ] Performance tuning
  - [ ] Cache clearing

- [ ] Update `README.md`:
  - [ ] Reference new cache system
  - [ ] Link to docs

- [ ] Add JSDoc to all public APIs:
```typescript
/**
 * Download a song for offline playback
 * @param song - Song to download
 * @returns Promise with cached song
 * @example
 * const { mutate } = useDownloadSong();
 * mutate(song);
 */
```

- [ ] Create migration guide for maintainers

- [ ] Commit:
```bash
git commit -m "docs: comprehensive documentation"
```

### Phase 5 Complete Checklist

- [ ] 30+ tests written
- [ ] 95%+ code coverage
- [ ] All docs complete
- [ ] Examples provided
- [ ] Troubleshooting guide written
- [ ] Tests pass
- [ ] Lint passes
- [ ] Ready for code review

**Commit**: `git commit -m "phase-5: testing & documentation complete"`

---

## Final Verification Checklist ✅

Run these before pushing to production:

```bash
# 1. Full build
pnpm build
# ✅ Success, no errors

# 2. Linting
pnpm lint
# ✅ 0 issues

# 3. Tests
pnpm test
# ✅ All passing

# 4. Type checking
pnpm tsc --noEmit
# ✅ 0 errors

# 5. Bundle analysis
ANALYZE=true pnpm build
# ✅ Compare size vs baseline (should be 60%+ smaller cache code)

# 6. Grep for old code
grep -r "lib/storage\|useCacheManager\|DownloadsProvider\|OfflineProvider" src/
# ✅ 0 results

# 7. Check git status
git status
# ✅ Only expected new files, old files deleted
```

---

## After Implementation

- [ ] Create PR with full description
- [ ] Run full CI/CD pipeline
- [ ] Code review approval
- [ ] Test in staging
- [ ] Monitor production for 1 week
- [ ] Keep backup branch for 2 weeks (in case rollback needed)

---

## Rollback Plan (If Needed)

If critical issues found:

```bash
# Revert to old code
git revert HEAD~14  # Revert all cache refactor commits

# Or checkout backup
git checkout backup/old-storage-backup
```

Keep old code available for 2 weeks after merge.

---

## Time Tracking

Track actual time vs estimates:

| Phase | Estimated | Actual | Status |
|-------|-----------|--------|--------|
| 1: Foundation | 3d | __ | __ |
| 2: Migration | 4d | __ | __ |
| 3: Downloads | 3d | __ | __ |
| 4: Cleanup | 2d | __ | __ |
| 5: Testing | 2d | __ | __ |
| **Total** | **14d** | **__** | __ |

---

## Sign-Off

- [ ] Implementation complete
- [ ] All phases verified
- [ ] Tests passing 100%
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] Ready for production

**Date Completed**: ___________  
**Implemented By**: ___________  
**Reviewed By**: ___________  

---

**Next**: Start Phase 1 with constants.ts
