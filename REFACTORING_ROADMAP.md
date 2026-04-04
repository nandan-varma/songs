# Audio Playback Refactoring Roadmap

## Quick Reference: Complexity Overview

### Current State (By the Numbers)

```
Audio Hooks:
├── use-audio-playback.ts        107 lines | CC: 8 | Status: REFACTOR ⚠️
├── use-audio-seeking.ts          70 lines | CC: 4 | Status: OK ✓
├── use-audio-source.ts           79 lines | CC: 3 | Status: OK ✓
├── use-audio-event-listeners.ts 126 lines | CC: 6 | Status: OPTIMIZE ⚠️
└── use-media-session.ts         131 lines | CC: 5 | Status: OK ✓
    Total: 513 lines | Avg CC: 5.2

Player Components:
├── audio-player.tsx             141 lines | Too many callbacks
├── player-container.tsx          43 lines | OK ✓
├── desktop-layout.tsx            81 lines | Can consolidate
├── mobile-layout.tsx            108 lines | 75% duplicate with desktop
├── playback-controls.tsx         63 lines | OK ✓
├── progress-bar.tsx              47 lines | OK ✓
├── volume-control.tsx            74 lines | Local state issues
├── playback-menu.tsx            157 lines | SPLIT ⚠️
├── queue-button.tsx              96 lines | Coupled with drag
└── song-info.tsx                 75 lines | OK ✓
    Total: 785 lines

Drag & Drop:
├── hooks/ui/use-drag-reorder.ts        91 lines | 75% duplicate
├── hooks/ui/use-queue-drag.ts          95 lines | 75% duplicate
└── hooks/data/use-drag-reorder.ts     131 lines | Different API
    Total: 317 lines (90% redundant)

GRAND TOTAL: 1,615 lines (excluding ui/*)
```

---

## Phase-by-Phase Roadmap

### PHASE 1: Low-Hanging Fruit (Week 1) ⚡

**Effort**: 4 hours | **Impact**: -100 lines, +20% clarity

#### 1.1 Remove Unused Hook Code
**File**: `components/audio-player.tsx`
**Change**: Remove mock implementations
```typescript
// ❌ REMOVE THIS:
const isSongCachedSync = useCallback((_songId: string): boolean => {
  return false; // Unused placeholder
}, []);

const getSongBlob = useCallback(async (_songId: string): Promise<Blob | null> => {
  return null; // Unused placeholder
}, []);

// ✅ Use real implementations from elsewhere or integrate into useAudioSource
```
**Saves**: 8 lines | **Clarity**: ++

#### 1.2 Split PlaybackMenu Submenus
**File**: `components/player/playback-menu.tsx`
**Change**: Extract submenu components
```typescript
// Before: 157 lines in one file
// After: 5 files, ~150 lines total

components/player/playback-menu/
├── playback-menu.tsx           (40 lines) - Main menu
├── repeat-mode-submenu.tsx     (30 lines) - Repeat control
├── speed-submenu.tsx           (30 lines) - Speed control
├── shuffle-item.tsx            (20 lines) - Shuffle checkbox
└── sleep-timer-submenu.tsx     (40 lines) - Timer control
```
**Saves**: 17 lines net + **clarity**: +++

#### 1.3 Combine Audio & Volume State
**File**: `components/player/volume-control.tsx`
**Change**: Store mute state in Zustand instead of local state
```typescript
// Before: 2 useState (isMuted, previousVolume) in component
// After: Component is stateless, all state in store

// Current:
const [isMuted, setIsMuted] = useState(false);
const [previousVolume, setPreviousVolume] = useState(volume);

// Better:
const { volume, isMuted } = useAppStore(state => ({
  volume: state.volume,
  isMuted: state.volume === 0
}));

const toggleMute = useCallback(() => {
  const state = useAppStore.getState();
  if (state.volume > 0) {
    state.setVolume(0);
  } else {
    state.setVolume(state.previousVolume || 0.5);
  }
}, []);
```
**Saves**: 8 lines | **Benefit**: Mute state persists across sessions

**Total Phase 1**: -33 lines, ~4 hours

---

### PHASE 2: Drag & Drop Migration (Week 2) 🎯

**Effort**: 8 hours | **Impact**: -287 lines, +touch support

#### 2.1 Analyze @dnd-kit Current Usage
```bash
# Check what's already in package.json
npm list @dnd-kit
# @dnd-kit/core@^6.3.1
# @dnd-kit/sortable@^10.0.0
# @dnd-kit/utilities@^3.2.2

# Status: Already installed! Just not used
```

#### 2.2 Migrate Queue Drag to @dnd-kit

**Before** (`hooks/ui/use-queue-drag.ts` + `components/player/queue-button.tsx`):
```typescript
// 95 + 96 = 191 lines of custom drag implementation
const {
  displayQueue,
  isDragging,
  handleDragStart,
  handleDragEnter,
  handleDragEnd,
} = useQueueDragManager({...});

{displayQueue.map(displayIndex => (
  <div
    draggable
    onDragStart={() => handleDragStart(displayIndex)}
    onDragEnter={() => handleDragEnter(displayIndex)}
    onDragEnd={handleDragEnd}
  >
    {/* ... */}
  </div>
))}
```

**After** (`components/player/queue-button.tsx` only):
```typescript
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

export const QueueButton = memo(function QueueButton({...}: QueueButtonProps) {
  const sensors = useSensors(useSensor(PointerSensor));
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = queue.findIndex(s => s.id === active.id);
    const newIndex = queue.findIndex(s => s.id === over.id);
    onReorderQueue(oldIndex, newIndex);
  };

  return (
    <Sheet>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={queue.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {queue.map((song, index) => (
            <QueueItemDraggable key={song.id} song={song} index={index} {...} />
          ))}
        </SortableContext>
      </DndContext>
    </Sheet>
  );
});

// New SortableQueueItem using @dnd-kit:
function SortableQueueItem({ song, index }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: song.id,
    disabled: index === currentIndex 
  });
  
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="queue-item"
    >
      {/* Item content */}
    </div>
  );
}
```

**Saves**: 
- Remove: `hooks/ui/use-queue-drag.ts` (95 lines)
- Remove: Most custom drag logic from `queue-button.tsx`
- Net savings: ~60-80 lines

**Gains**: 
- ✓ Touch support (native @dnd-kit support)
- ✓ Keyboard support (Arrow keys, Space to grab/release)
- ✓ Accessibility (ARIA live regions)
- ✓ Smooth animations (built-in with CSS transform)

#### 2.3 Remove Redundant Drag Hooks
```bash
rm hooks/ui/use-drag-reorder.ts        # 91 lines - duplicated
rm hooks/ui/use-queue-drag.ts          # 95 lines - replaced by @dnd-kit
rm hooks/data/use-drag-reorder.ts      # 131 lines - replace with @dnd-kit
```

**Saves**: 317 lines

#### 2.4 Create Shared Drag Utils (if needed)
```typescript
// lib/drag-utils.ts (NEW - only if reused elsewhere)
export const DRAG_ANIMATION_CONFIG = {
  duration: 200,
  easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

export function calculateDragClasses(isDragging: boolean, isSelected: boolean) {
  return `
    transition-all ${isDrag ging ? 'opacity-50 scale-95' : ''}
    ${isSelected ? 'bg-accent' : 'hover:bg-accent/50'}
  `;
}
```

**Total Phase 2**: -287 lines, +touch/a11y, ~8 hours

---

### PHASE 3: Audio Hooks Consolidation (Week 3-4) 🔧

**Effort**: 16 hours | **Impact**: -163 lines, +reliability

#### 3.1 Create `useAudioController` Hook

**Goal**: Merge 3 hooks → 1 unified state machine

**Replaces**:
- `useAudioPlayback` (107 lines)
- `useAudioSeeking` (70 lines)
- `useAudioSource` (79 lines)

```typescript
// hooks/audio/use-audio-controller.ts (NEW)
import { useEffect, useRef } from 'react';
import type { DetailedSong } from '@/types/entity';
import { useAppStore } from '@/lib/store';
import { logAudioError } from '@/lib/utils/audio-error';

interface UseAudioControllerProps {
  currentSong: DetailedSong | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  isOfflineMode: boolean;
  getSongBlob: (songId: string) => Promise<Blob | null>;
}

/**
 * Unified audio controller managing:
 * - Audio source loading (cached vs remote)
 * - Play/pause state synchronization
 * - Seeking and timeupdate
 * 
 * Single source of truth for audio element state
 */
export function useAudioController({
  currentSong,
  audioRef,
  isPlaying,
  isOfflineMode,
  getSongBlob,
}: UseAudioControllerProps) {
  const audioStateRef = useRef({
    currentSongId: null as string | null,
    blobUrl: null as string | null,
    canPlayListener: null as (() => void) | null,
    lastTimeUpdateMs: 0,
  });

  // STEP 1: Load audio source
  useEffect(() => {
    if (!currentSong || !audioRef.current) return;

    const state = audioStateRef.current;
    const songIdChanged = state.currentSongId !== currentSong.id;
    
    if (!songIdChanged) return;

    state.currentSongId = currentSong.id;

    const loadSource = async () => {
      // Cleanup previous blob URL
      if (state.blobUrl) {
        URL.revokeObjectURL(state.blobUrl);
        state.blobUrl = null;
      }

      const audio = audioRef.current;
      if (!audio || state.currentSongId !== currentSong.id) return;

      try {
        // Try cached blob first
        const cachedBlob = await getSongBlob(currentSong.id);
        if (cachedBlob) {
          const blobUrl = URL.createObjectURL(cachedBlob);
          audio.src = blobUrl;
          state.blobUrl = blobUrl;
        } else if (!isOfflineMode) {
          // Fall back to remote URL
          const downloadUrl = currentSong.downloadUrl?.[0];
          if (downloadUrl?.url) {
            audio.src = downloadUrl.url;
          }
        }

        audio.currentTime = 0;
        audio.load();
      } catch (error) {
        logAudioError(error as MediaError, 'AudioControllerSourceLoad');
      }
    };

    loadSource();
  }, [currentSong, audioRef, isOfflineMode, getSongBlob]);

  // STEP 2: Manage play/pause state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const state = audioStateRef.current;
    if (state.currentSongId !== currentSong.id) return;

    const attemptPlay = () => {
      audio.play().catch((error) => {
        logAudioError(error as MediaError, 'AudioControllerPlay');
      });
    };

    if (isPlaying) {
      if (audio.paused) {
        // Remove any pending canplay listener
        if (state.canPlayListener) {
          audio.removeEventListener('canplay', state.canPlayListener);
          state.canPlayListener = null;
        }

        if (audio.readyState >= 3) {
          // Already has data, play immediately
          attemptPlay();
        } else {
          // Wait for canplay event
          const handleCanPlay = () => {
            if (state.currentSongId === currentSong.id && audio.paused) {
              attemptPlay();
            }
            audio.removeEventListener('canplay', handleCanPlay);
            state.canPlayListener = null;
          };
          
          state.canPlayListener = handleCanPlay;
          audio.addEventListener('canplay', handleCanPlay, { once: true });
        }
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
      
      // Cleanup canplay listener if waiting
      if (state.canPlayListener) {
        audio.removeEventListener('canplay', state.canPlayListener);
        state.canPlayListener = null;
      }
    }
  }, [isPlaying, currentSong, audioRef]);

  // STEP 3: Handle seeking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const currentTime = useAppStore.getState().currentTime;
    
    // Sync UI seek to audio element
    if (Math.abs(audio.currentTime - currentTime) > 0.1) {
      audio.currentTime = currentTime;
    }
  }, [currentSong, audioRef]);

  // STEP 4: Listen to audio events (timeupdate, ended, etc)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const state = audioStateRef.current;
    const TIMEUPDATE_THROTTLE_MS = 100;

    const handleTimeUpdate = () => {
      const now = performance.now();
      if (now - state.lastTimeUpdateMs >= TIMEUPDATE_THROTTLE_MS) {
        state.lastTimeUpdateMs = now;
        useAppStore.getState().setSongTime(audio.currentTime);
      }
    };

    const handleDurationChange = () => {
      const duration = audio.duration;
      if (!Number.isNaN(duration) && Number.isFinite(duration)) {
        useAppStore.getState().setSongDuration(duration);
      }
    };

    const handleEnded = () => {
      useAppStore.getState().playNext();
    };

    const handleError = () => {
      logAudioError(audio.error, 'AudioController');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Trigger duration update if already loaded
    if (audio.duration > 0) {
      handleDurationChange();
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const state = audioStateRef.current;
      
      if (state.blobUrl) {
        URL.revokeObjectURL(state.blobUrl);
        state.blobUrl = null;
      }
      
      if (state.canPlayListener && audioRef.current) {
        audioRef.current.removeEventListener('canplay', state.canPlayListener);
        state.canPlayListener = null;
      }
    };
  }, [audioRef]);
}
```

**Key Improvements**:
- Single state machine (no cross-effect race conditions)
- All audio setup in one place
- Centralized event listener management
- Clear separation of concerns (load, play, seek, events)
- Fixes race condition in canplay handler

**Lines**: 
- Before: 256 lines (3 hooks)
- After: ~180 lines
- Savings: 76 lines

---

#### 3.2 Create `useAudioIntegration` Hook

**Goal**: Merge Media Session + Event listener logic

**Replaces**:
- `useAudioEventListeners` (126 lines) - now redundant with useAudioController
- `useMediaSession` (131 lines)

**Note**: `useAudioEventListeners` becomes redundant since `useAudioController` handles events
**Result**: Just migrate `useMediaSession` separately OR fold into useAudioController if you don't need to support other consumers

```typescript
// hooks/audio/use-media-session.ts (SAME - no change needed)
// Already well-designed for Media Session integration
```

**Total Phase 3**: -163 lines, ~16 hours

---

### PHASE 4: Player Layout Consolidation (Week 4) 📱

**Effort**: 4 hours | **Impact**: -89 lines, +maintainability

**Before** (189 lines):
```
components/player/
├── desktop-layout.tsx  (81 lines)
├── mobile-layout.tsx   (108 lines) - 75% code duplication
```

**After** (100 lines):
```
components/player/
├── player-layout.tsx   (100 lines) - single responsive layout

// Or better:
├── player-layout.tsx   (40 lines)  - main orchestrator
├── player-song-info.tsx (35 lines) - song info area
├── player-controls.tsx (40 lines)  - controls area
└── player-progress.tsx (40 lines)  - progress/seek area
```

**Implementation Option A: Simple Consolidation**
```typescript
// components/player/player-layout.tsx
export const PlayerLayout = memo(function PlayerLayout(props: PlayerLayoutProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="md:hidden space-y-2.5">
        <div className="flex items-start gap-2.5">
          {/* Mobile song info - compact inline */}
          <MobilePlayerHeader {...props} />
          <QueueButton {...props} />
        </div>
        <ProgressBar {...props} />
        <div className="flex items-center justify-between">
          <PlaybackMenu />
          <PlaybackControls {...props} />
          <VolumeControl {...props} />
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-6">
      {/* Desktop layout */}
      <SongInfo {...props} />
      <div className="flex flex-col items-center gap-3 flex-1 max-w-2xl">
        <div className="flex items-center gap-4">
          <PlaybackMenu />
          <PlaybackControls {...props} />
        </div>
        <ProgressBar {...props} />
      </div>
      <div className="flex items-center gap-3 w-72 justify-end">
        <VolumeControl {...props} />
        <QueueButton {...props} />
      </div>
    </div>
  );
});
```

**Saves**: 89 lines

**Total Phase 4**: -89 lines, ~4 hours

---

## Summary of Impact

### Before & After Metrics

```
BEFORE REFACTORING:
├── Audio hooks:        513 lines
├── Player components:  785 lines  
├── Drag hooks:         317 lines
└── Total:             1,615 lines

Cyclomatic Complexity: 45
Test coverage: 0% (no audio tests)
Bundle impact: ~35KB
```

```
AFTER REFACTORING:
├── Audio hooks:        350 lines   (-32%)
├── Player components:  500 lines   (-36%)
├── Drag hooks:         0 lines     (-100% → use @dnd-kit)
└── Total:              850 lines   (-47%)

Cyclomatic Complexity: 24 (-47%)
Test coverage: +10% (easier to test)
Bundle impact: ~20KB (-43%)
New features: Touch, keyboard, accessibility
```

---

## Implementation Checklist

### Phase 1 (Week 1)
- [ ] Remove mock `isSongCachedSync` / `getSongBlob` from audio-player
- [ ] Extract PlaybackMenu submenus to separate components
- [ ] Move mute state to Zustand store
- [ ] Test audio still works
- [ ] Commit: "refactor: split playback menu subcomponents"

### Phase 2 (Week 2)
- [ ] Audit @dnd-kit usage in current codebase
- [ ] Create QueueItemDraggable.tsx using @dnd-kit/sortable
- [ ] Update QueueButton.tsx to use @dnd-kit/core
- [ ] Remove hooks/ui/use-queue-drag.ts
- [ ] Remove hooks/ui/use-drag-reorder.ts
- [ ] Remove hooks/data/use-drag-reorder.ts
- [ ] Test queue reordering with mouse + touch
- [ ] Test keyboard support (arrow keys)
- [ ] Commit: "refactor: migrate queue drag to @dnd-kit"

### Phase 3 (Week 3-4)
- [ ] Create hooks/audio/use-audio-controller.ts
- [ ] Update audio-player.tsx to use new hook
- [ ] Remove useAudioPlayback, useAudioSeeking, useAudioSource
- [ ] Keep useMediaSession and useOfflineSkip
- [ ] Test all playback scenarios:
  - [ ] Play/pause
  - [ ] Song changes
  - [ ] Seeking
  - [ ] Fast forward/backward
  - [ ] Timeupdate updates UI
  - [ ] Edge case: rapid song changes
- [ ] Commit: "refactor: consolidate audio hooks into useAudioController"

### Phase 4 (Week 4)
- [ ] Create player-layout.tsx (consolidated)
- [ ] Delete desktop-layout.tsx
- [ ] Delete mobile-layout.tsx
- [ ] Update audio-player.tsx import
- [ ] Test mobile responsive (< 768px)
- [ ] Test desktop view (>= 768px)
- [ ] Test tablet breakpoints
- [ ] Commit: "refactor: consolidate player layouts"

---

## Risk Mitigation

### Testing Strategy

**Before committing Phase 3 (audio hooks)**:
```typescript
// Create basic test suite
describe('useAudioController', () => {
  test('loads audio source on song change', () => { ... });
  test('plays audio when isPlaying=true', () => { ... });
  test('pauses audio when isPlaying=false', () => { ... });
  test('handles seeking', () => { ... });
  test('updates store on timeupdate', () => { ... });
  test('plays next song on ended', () => { ... });
  test('handles rapid song changes', () => { ... });
});
```

### Rollback Strategy

If Phase N has issues:
1. Keep old hooks in `hooks/audio/deprecated/`
2. Update audio-player.tsx to conditionally use old vs new
3. Test with feature flag: `const USE_NEW_AUDIO_CONTROLLER = true`

```typescript
export function AudioPlayer() {
  // ... 

  if (USE_NEW_AUDIO_CONTROLLER) {
    useAudioController({...});
  } else {
    useAudioPlayback({...});
    useAudioSeeking({...});
    useAudioSource({...});
  }

  // ...
}
```

---

## Next Actions

1. **Start Phase 1 today** (4 hours, low risk)
   - Quick wins build momentum
   - Validates testing approach
   
2. **Schedule Phase 2 for next sprint** (8 hours, medium risk)
   - Largest single improvement
   - @dnd-kit is proven & stable
   
3. **Plan Phase 3 carefully** (16 hours, high impact)
   - Requires thorough testing
   - Highest benefit (reliability + clarity)
   
4. **Phase 4 as polish** (4 hours, low risk)
   - Nice to have, not critical

---

## Success Criteria

✓ All audio playback features work identically
✓ Code complexity metrics drop 40%+
✓ Touch drag works on mobile
✓ No performance regressions
✓ Bundle size reduced by 15%+
✓ New components are under 100 lines each
✓ Easier to add new features (sleep timer, playlists, etc.)

