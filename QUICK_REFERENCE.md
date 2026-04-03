# Songs PWA - Quick Reference for Maintainability Improvements

## What Was Analyzed

- **174 TypeScript files** across the codebase
- **3,797 LOC** in hooks, lib, and types directories
- **14 major components** with >150 lines each
- **5 context providers** for global state
- **12+ React Query hooks** with similar patterns
- **Multiple state management patterns**

## Key Problems Identified

### 1. Type Safety (Critical - 2-3 hours to fix)
- `any` types in 8 React Query hooks
- API responses not properly typed
- Missing discriminated unions

**Quick Fix:** Update `/lib/api/index.ts` with proper response types

### 2. Code Duplication (High - 3-4 hours)
- 12+ identical query hook patterns
- Repeated responsive size classes
- Duplicate async/loading patterns

**Quick Fix:** Create `lib/constants/responsive-sizes.ts`

### 3. Component Complexity (High - variable)
4 mega-components that need refactoring:
- SearchContent (296 lines)
- SongActionMenu (217 lines)
- QueueButton (268 lines)
- HistoryList (293 lines)

**Quick Fix:** Start with hooks extraction (`useAsyncAction()`)

### 4. Error Handling (Medium - 1-2 hours)
- Inconsistent error patterns
- Mix of logError(), console.error(), toast.error()

**Quick Fix:** Fix `console.error()` in history-list.tsx line 129

### 5. Prop Drilling (Medium - 2-3 hours)
- AudioPlayer passes 13 props to layouts
- Could use direct context access instead

**Quick Fix:** Create custom hooks for layout components

### 6. Cache System (Medium - 2-3 hours)
- Multiple TODOs in offline-related code
- Incomplete implementation

**Quick Fix:** Complete the cache layer for favorites

---

## Quick Wins (Start Here - 5-10 Hours Total)

### Win #1: Responsive Sizes Constants (1 hour)
**File to create:** `lib/constants/responsive-sizes.ts`

**Where to use:**
- song-item.tsx (lines 88-99)
- history-list.tsx (lines 149-157)
- Other components

### Win #2: useControlledState Hook (30 minutes)
**File to create:** `hooks/ui/use-controlled-state.ts`

**Where to use:**
- create-playlist-dialog.tsx (lines 37-38)
- playlist-edit-dialog.tsx (lines 155-156)

### Win #3: Fix console.error (15 minutes)
**File to fix:** `components/history-list.tsx` line 129

**Change:** `console.error()` → `logError()`

### Win #4: Extract Error Categories (1 hour)
**File to create:** `lib/utils/error-classifier.ts`

**Refactor:** Move logic from error-boundary.tsx (lines 90-176)

### Win #5: Basic Zod Schemas (1 hour)
**File to create:** `lib/validations/entities.ts`

**Include:** EntityIdSchema, basic entity schemas

---

## Priority Implementation Roadmap

### Week 1: Quick Wins + Type Safety
- Day 1-2: Complete all 5 quick wins
- Day 3-5: Fix `any` types in React Query + add Zod schemas

### Week 2: Hook Extraction
- Create `useAsyncAction()` hook
- Create factory function for query hooks
- Extract `useDetailedSong()` hook

### Week 3-4: Component Refactoring
- Split SearchContent
- Extract SongActionMenu sub-components
- Refactor QueueButton and PlaylistEditDialog

---

## File Priority Matrix

| File | Severity | Effort | Start |
|------|----------|--------|-------|
| /hooks/data/queries.ts | HIGH | 2-3h | Week 1 |
| /lib/api/index.ts | HIGH | 3-4h | Week 1 |
| /components/search-content.tsx | HIGH | 3-5h | Week 2 |
| /contexts/favorites-context.tsx | HIGH | 2-3h | Week 1 |
| /components/common/song-action-menu.tsx | MED | 2-3h | Week 2 |
| /components/player/queue-button.tsx | MED | 2-3h | Week 3 |
| /components/common/playlist-edit-dialog.tsx | MED | 2-3h | Week 3 |
| /components/history-list.tsx | MED | 1-2h | Week 2 |
| /components/common/error-boundary.tsx | LOW | 1-2h | Quick Win |
| /components/audio-player.tsx | MED | 1-2h | Week 2 |

---

## Testing Strategy

### After Each Phase
1. Run `pnpm lint` - check for style violations
2. Run `pnpm format` - ensure consistency
3. Manual testing of affected features
4. Test in offline mode (if applicable)

### Types of Changes
- **Type changes**: No behavior change, safe refactoring
- **Hook extraction**: Extract behavior, maintain same interface
- **Component splitting**: Break apart UI, maintain same output

---

## Tools & Commands

```bash
# Check code quality
pnpm lint

# Format code
pnpm format

# Build for analysis
ANALYZE=true pnpm build

# Development
pnpm dev
```

---

## Reference Documentation

- **Full Analysis:** See `MAINTAINABILITY_ANALYSIS.md`
- **Executive Summary:** See `MAINTAINABILITY_SUMMARY.txt`
- **Architecture Guide:** See `docs/` directory
- **Code Style:** See `AGENTS.md`

---

## Common Patterns to Extract

### Pattern 1: Async Loading
```typescript
// Current (repeated everywhere)
const [isLoading, setIsLoading] = useState(false);
const handleAction = useCallback(async (e?: React.MouseEvent) => {
  if (e) e.preventDefault();
  if (isLoading) return;
  try {
    setIsLoading(true);
    const result = await asyncFn();
    onSuccess(result);
  } finally {
    setIsLoading(false);
  }
}, [asyncFn, onSuccess, isLoading]);

// After extraction (useAsyncAction hook)
const { execute: handleAction, isLoading } = useAsyncAction(
  () => asyncFn(),
  onSuccess,
);
```

### Pattern 2: Controlled/Uncontrolled State
```typescript
// Current (repeated in dialogs)
const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
const setIsOpen = setControlledOpen || setInternalOpen;

// After extraction (useControlledState hook)
const [isOpen, setIsOpen] = useControlledState(controlledOpen, setControlledOpen, false);
```

### Pattern 3: React Query Hooks
```typescript
// Current (repeated 12+ times with any types)
export function useSong(id: string) {
  return useQuery({
    queryKey: CACHE_KEYS.SONGS(id),
    queryFn: async () => {
      const response = await getSongById(id);
      return (response as any).data || response;
    },
    staleTime: CACHE_TIMES.SONG,
  });
}

// After refactoring (factory pattern)
export const useSong = createEntityQuery<DetailedSong>({
  queryKey: (id) => CACHE_KEYS.SONGS(id),
  queryFn: (id) => getSongById(id),
  staleTime: CACHE_TIMES.SONG,
});
```

---

## Checkpoints

- [ ] Week 1: All quick wins completed
- [ ] Week 1: Type safety issues fixed
- [ ] Week 2: All custom hooks created
- [ ] Week 2: SearchContent split
- [ ] Week 3: All mega-components refactored
- [ ] Week 3: Error handling unified
- [ ] After: Verify no regressions with `pnpm build`

---

## Expected Results

After completing all recommendations:
- **Code duplication:** -25%
- **Type coverage:** 80% → 99%+
- **Mega-components:** 14 → 10
- **Developer experience:** ✨ Significantly improved
- **Maintenance burden:** ↓ Reduced

