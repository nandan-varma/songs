# Agent Instructions for Songs PWA

## Commands

### Core Commands
- `pnpm dev` - Start Next.js dev server
- `pnpm build` - Create production build
- `pnpm start` - Start production server
- `pnpm lint` - Run Biome linter on all files
- `pnpm format` - Format code with Biome

### Analysis Commands
- `ANALYZE=true pnpm build` - Analyze bundle size
- `pnpm analyze:turbopack` - Analyze with Turbopack

## Project Structure

```
app/              # Next.js App Router pages
components/       # React components (ui/, common/, player/, song/, album/, etc.)
contexts/         # 7 contexts: player, queue, favorites, local-playlists, history, downloads, offline
hooks/            # Organized: audio/, data/, downloads/, network/, pages/, playback/, player/, search/, storage/, ui/
lib/              # api/, constants/, db/, storage/, validations/, utils/
types/            # entity/, api/, player.ts
docs/             # Full documentation in docs/
```

## Code Style (Biome)

### Formatting
- **Indentation**: Tabs (not spaces)
- **Quotes**: Double quotes (`"`)
- **Semicolons**: Required
- **One import per line**

### Imports Order
1. React (`"react"`, `"next"`)
2. External libraries (npm packages)
3. `@/components/*`
4. `@/hooks/*`
5. `@/contexts/*`
6. `@/types/*`
7. `@/lib/*`
8. Relative imports

### File Naming
| Type | Convention | Example |
|------|------------|---------|
| Components | kebab-case | `song-item.tsx` |
| Hooks | `use-*` kebab-case | `use-audio-playback.ts` |
| Contexts | kebab-case | `player-context.tsx` |
| Utilities | camelCase | `time.ts` |
| Types | PascalCase (in types/) | `PlayerState.ts` |

### Naming Conventions
- **Components**: PascalCase (`SongItem`)
- **Hooks**: `use*` + camelCase (`usePlayer`)
- **Functions/Variables**: camelCase (`downloadSong`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_VOLUME`)
- **Types/Interfaces**: PascalCase (`DetailedSong`)

### TypeScript
- Strict mode - no implicit `any`
- Use `unknown` instead of `any` when type is unknown
- Explicit types for function parameters
- Use type inference when obvious

### Error Handling
- User errors: `toast.error()` from sonner
- Audio errors: `logAudioError()` from `@/lib/utils/audio-error`
- Non-critical: silent catch (prefix with `_`)
- No `console.log` in production

### React Patterns
- Use `memo()` for expensive components
- `useCallback()` for callbacks passed to children
- `useMemo()` for expensive computations
- Client components: `"use client"` directive

### Special Patterns
- **3-tier Player Context**: PlaybackContext (high freq), QueueContext (med), PlayerActionsContext (stable)
- **Animations**: Use `motion` library, respect `useAnimationPreferences()`
- **URL State**: Use `nuqs` library with `useQueryStates()`
- **IndexedDB**: For offline song/image storage

## Key Patterns

### Context Splitting
```typescript
// High-frequency: currentTime, isPlaying, volume (~10 updates/sec)
// Medium-frequency: queue, currentIndex (user actions)
// Stable: playSong, playNext, togglePlayPause (never change)
```

### Offline Architecture
- IndexedDB for persistent caching
- Service Worker with cache-first (static), network-first (API)
- LRU eviction for storage management
- Use `useOffline()` hook for network detection

### React Query
- Server state with caching
- staleTime: 10min (metadata), 1min (search)
- Hooks: `useSong()`, `useAlbum()`, `usePlaylist()`, etc.

## Adding Features

1. Components: `/components/feature-name/component.tsx`
2. Hooks: `/hooks/category/use-feature-name.ts`
3. Types: Add to `/types/entity/index.ts`
4. Context: Create in `/contexts/` if global state needed
5. API: Add to `/lib/api/index.ts`

## Important Notes

- No Cursor/Copilot rules exist in this repo
- Tests use Vitest pattern (no test runner configured currently)
- UI components (components/ui/*) have linting/formatting disabled
- Always run `pnpm lint` and `pnpm format` before committing
