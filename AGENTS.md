# Agent Instructions for Songs App

## Commands

### Core Commands
- **Development**: `pnpm dev` - Start Next.js dev server
- **Build**: `pnpm build` - Create production build
- **Start**: `pnpm start` - Start production server
- **Lint**: `pnpm lint` - Run Biome linter on all files
- **Format**: `pnpm format` - Format code with Biome

### Analysis Commands
- **Analyze**: `ANALYZE=true pnpm build` - Analyze bundle size
- **Analyze Turbopack**: `pnpm analyze:turbopack` - Analyze with Turbopack

## Project Structure

```
/Users/nandan/dev/songs/
├── app/                 # Next.js App Router pages
├── components/          # React components (organized by feature)
│   ├── ui/             # Radix UI + Tailwind components
│   ├── common/         # Shared: error-boundary, progressive-image, search-bar
│   └── player/         # Audio player: audio-player, layouts, controls
├── contexts/           # React Context providers
├── hooks/              # Custom hooks (organized by category)
│   ├── audio/          # use-audio-*, use-media-session
│   ├── player/         # use-offline-player, use-offline-skip
│   ├── data/           # queries, use-cache-manager
│   ├── storage/        # use-device-storage, use-download-operations
│   ├── network/        # use-network-detection, use-service-worker
│   └── pages/          # Page-specific hooks (use-song, use-album, etc.)
├── lib/                # Utilities
│   ├── api/            # API functions (lib/api/index.ts)
│   ├── utils/          # time.ts, audio-error.ts
│   ├── constants/      # API_BASE_URL, AUDIO_QUALITY
│   └── db/             # IndexedDB operations
├── types/              # TypeScript types
│   ├── entity/         # Domain types: Song, Album, Artist, etc.
│   └── api/            # API response types
└── docs/               # Architecture and guide documentation
```

## Code Style Guidelines

### Imports Order
1. React imports
2. External libraries (npm packages)
3. `@/components/*` imports
4. `@/hooks/*` imports
5. `@/contexts/*` imports
6. `@/types/*` imports
7. `@/lib/*` imports
8. Relative imports

### File Naming
- **Components**: kebab-case (`song-item.tsx`, `audio-player.tsx`)
- **Hooks**: `use-*` prefix, kebab-case (`use-audio-playback.ts`)
- **Contexts**: kebab-case (`player-context.tsx`)
- **Utilities**: camelCase (`time.ts`, `audio-error.ts`)
- **Types**: PascalCase (in `types/` directory)

### Naming Conventions
- **Components**: PascalCase (`SongItem`, `AudioPlayer`)
- **Hooks**: `use*` prefix, camelCase (`usePlayer`, `useOfflineSkip`)
- **Functions/Variables**: camelCase (`downloadSong`, `isPlaying`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_VOLUME`, `API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`DetailedSong`, `PlayerActions`)

### Formatting (Biome)
- **Indentation**: Tabs (not spaces)
- **Quotes**: Double quotes (`"`)
- **Semicolons**: Required
- **One import per line**

### TypeScript
- Strict mode enabled - no implicit `any`
- Use type inference when obvious
- Explicit types for function parameters
- Use `unknown` instead of `any` when type is unknown

## Key Patterns

### Context Splitting (3-tier)
- **PlaybackContext**: High-frequency (currentTime, isPlaying, volume) - re-renders often
- **QueueContext**: Medium-frequency (queue, currentIndex) - re-renders on changes
- **PlayerActionsContext**: Stable - never changes, no re-renders

### Offline Architecture
- IndexedDB for persistent song caching
- Service Worker with cache strategies
- LRU eviction for storage management
- `useOffline()` hook for network detection

### React Query
- Server state management with caching
- Default staleTime: 10min for metadata, 1min for search
- Use `useSong()`, `useAlbum()`, `usePlaylist()` hooks

### Error Handling
- User-facing errors: `toast.error()` from sonner
- Non-critical errors: silent catch (prefix with `_` if needed)
- Audio errors: `logAudioError()` from `@/lib/utils/audio-error`
- No console.log in production code

## Common Tasks

### Adding a New Feature
1. Create components in `/components/feature-name/`
2. Create hooks in `/hooks/category/use-feature-name.ts`
3. Add types to `/types/entity/index.ts`
4. Update `/docs/guides/adding-feature.md` if significant

### Modifying Audio Player
- Audio hooks in `/hooks/audio/`
- Player components in `/components/player/`
- Player context in `/contexts/player-context.tsx`
- See `/docs/audio-architecture.md` for architecture

### Modifying Types
- Entity types: `/types/entity/index.ts`
- API types: `/types/api/index.ts`
- Player types: `/types/player.ts`

### Adding API Endpoint
1. Add to `/lib/api/index.ts`
2. Add types to `/types/api/index.ts`
3. Create hook in `/hooks/data/` if needed
4. Update `/docs/api/endpoints.md`
