# Project Organization Guide

This document describes the organization structure of the Songs PWA project.

## Directory Structure

```
/Users/nandan/dev/songs/
├── app/                      # Next.js App Router pages
│   ├── (routes)/             # Route groups
│   ├── album/
│   ├── artist/
│   ├── downloads/
│   ├── playlist/
│   └── song/
├── components/               # React components
│   ├── common/              # Shared/common components
│   │   ├── error-boundary.tsx
│   │   ├── progressive-image.tsx
│   │   └── search-bar.tsx
│   ├── player/              # Audio player components
│   │   ├── audio-player.tsx
│   │   ├── desktop-layout.tsx
│   │   ├── mobile-layout.tsx
│   │   ├── playback-controls.tsx
│   │   ├── progress-bar.tsx
│   │   ├── queue-button.tsx
│   │   ├── queue-sheet.tsx
│   │   ├── song-info.tsx
│   │   └── volume-control.tsx
│   ├── ui/                  # Radix UI + Tailwind components
│   ├── album/               # Album feature
│   ├── artist/              # Artist feature
│   ├── song/                # Song feature
│   ├── search/              # Search feature
│   └── offline/             # Offline feature
├── contexts/                # React Context providers
│   ├── downloads-context.tsx
│   ├── history-context.tsx
│   ├── offline-context.tsx
│   ├── player-context.tsx
│   └── queue-context.tsx
├── hooks/                   # Custom React hooks
│   ├── audio/               # Audio playback hooks
│   │   ├── use-audio-event-listeners.ts
│   │   ├── use-audio-playback.ts
│   │   ├── use-audio-source.ts
│   │   └── use-media-session.ts
│   ├── player/              # Player state hooks
│   │   ├── use-offline-player.ts
│   │   └── use-offline-skip.ts
│   ├── data/                # Data fetching hooks
│   │   ├── queries.ts
│   │   └── use-cache-manager.ts
│   ├── storage/             # Storage hooks
│   │   ├── use-device-storage.ts
│   │   └── use-download-operations.ts
│   ├── network/             # Network hooks
│   │   ├── use-network-detection.ts
│   │   └── use-service-worker.ts
│   ├── downloads/           # Download hooks
│   │   ├── use-download-progress.ts
│   │   └── use-download-retry.ts
│   ├── ui/                  # UI hooks
│   │   ├── use-mobile.ts
│   │   └── use-pwa-install.ts
│   └── pages/               # Page-specific hooks
├── lib/                     # Utilities and helpers
│   ├── api/                 # API functions
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   ├── audio-error.ts
│   │   └── time.ts
│   ├── constants/           # Constants
│   │   ├── index.ts
│   │   └── audio.ts
│   ├── db/                  # IndexedDB operations
│   │   ├── connection.ts
│   │   ├── index.ts
│   │   └── operations.ts
│   ├── metadata.ts
│   └── utils.ts
├── types/                   # TypeScript type definitions
│   ├── api/                 # API response types
│   │   └── index.ts
│   ├── entity/              # Domain entity types
│   │   └── index.ts
│   └── player.ts            # Player-related types
├── docs/                    # Documentation
│   ├── architecture/
│   │   └── audio-player.md
│   ├── guides/
│   └── api/
├── public/                  # Static assets
├── scripts/                 # Build scripts
└── ...
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | kebab-case | `song-item.tsx` |
| Hooks | camelCase + `use` prefix | `useAudioPlayback.ts` |
| Contexts | camelCase + `Context` suffix | `player-context.tsx` |
| Utilities | camelCase | `time.ts` |
| Types | PascalCase | `PlayerState.ts` |
| Constants | UPPER_SNAKE_CASE | `AUDIO_QUALITY.ts` |

## Import Patterns

### Components
```typescript
import { ComponentName } from "@/components/feature/component-name";
```

### Hooks
```typescript
import { useHookName } from "@/hooks/category/use-hook-name";
```

### Contexts
```typescript
import { useContextName } from "@/contexts/context-name";
```

### Types
```typescript
import type { TypeName } from "@/types/entity";
```

### Utilities
```typescript
import { utilityFunction } from "@/lib/utils/utility-name";
```

## Adding New Features

### 1. Create Component
```bash
# For a new feature called "favorites"
touch components/favorites/favorite-button.tsx
touch components/favorites/favorite-list.tsx
```

### 2. Create Hook (if needed)
```bash
touch hooks/data/use-favorites.ts
```

### 3. Update Types (if needed)
```bash
# Add types to types/entity/index.ts
```

### 4. Export from barrel files
```typescript
// types/entity/index.ts
export * from "./index";

// hooks/data/index.ts (create if needed)
export * from "./use-favorites";
```

## Code Style

See `AGENTS.md` for detailed coding guidelines including:
- Framework and language conventions
- Import organization
- Naming conventions
- React patterns
- Error handling
- Styling guidelines
- Accessibility requirements
