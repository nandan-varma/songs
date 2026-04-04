# Agent Guidelines for Songs Codebase

## Build & Development Commands

### Core Commands
```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build with TypeScript check
npm run start            # Start production server
npm run lint             # Lint with Biome (checks all rules)
npm run format           # Format code with Biome (tab-indented)
npm run analyze          # Analyze bundle size with webpack
npm run analyze:turbopack # Analyze with Turbopack
```

### Important Notes
- **No test runner configured** - This is a frontend app, add tests only if requested
- **Build must pass** - Always verify `npm run build` succeeds before committing
- **TypeScript strict mode** - Strict type checking enforced (`noUncheckedIndexedAccess: true`, `noImplicitOverride: true`)
- **Biome is the linter/formatter** - Not ESLint/Prettier, use `npm run lint` and `npm run format`

## Code Style Guidelines

### Imports & Path Aliases
- Use `@/*` path alias for all imports (maps to project root)
- Import order: React/Next → External packages → Internal (lib → components/hooks → types)
- Use named imports except for default exports (Next.js components, pages)
- Organize imports with Biome's `organizeImports` (automatic with format)

### Formatting
- **Tabs** for indentation (configured in Biome)
- **Double quotes** for strings
- **Line length**: ~100 characters (Biome default)
- **Semicolons**: Required
- Run `npm run lint` to check, `npm run format` to auto-fix

### TypeScript & Types
- **Strict mode enabled** - No `any` types unless marked with `// @ts-expect-error` or `as unknown`
- Type files: Store types in `types/*.ts` or co-located in same directory
- Use `type` keyword for type imports: `import type { Song } from "@/types/entity"`
- Export interfaces from files: `export interface ComponentProps { ... }`
- Props interfaces end with `Props`: `SongItemProps`, `ButtonProps`, etc.

### Naming Conventions
- **Components**: PascalCase (`SongItem`, `ProgressiveImage`)
- **Hooks**: camelCase starting with `use` (`useAppStore`, `useAudioPlayback`)
- **Functions**: camelCase (`playSong`, `handleClick`)
- **Constants**: SCREAMING_SNAKE_CASE (`DEFAULT_VOLUME`, `MAX_HISTORY_SIZE`)
- **Files**: 
  - Components: PascalCase (`SongItem.tsx`)
  - Hooks/Utils: camelCase (`use-audio-playback.ts`)
  - Pages: lowercase with hyphens (`song.tsx`, `album.tsx`)

### Error Handling
- Use try-catch for async operations
- Log errors with utility: `logError("context", error)`
- For errors, return `{ success: false, error: message }` pattern
- Show user feedback with `toast` from Sonner or error UI component
- Never silently fail; always communicate errors to UI or logs

### State Management
- **Zustand store** (`useAppStore`) for global state
- Use **granular selectors** for components: `const currentSong = useCurrentSong()`
- Access **actions via getState()** in callbacks: `useAppStore.getState().playSong(song)`
- **Never destructure store** in render: Use individual hooks for each property
- Domain-based hooks: `usePlayer()`, `useQueue()`, `useFavorites()`, `usePlaylists()`

### React Component Patterns
- Use **"use client"** directive for client-side components (default)
- Use **memo()** for expensive components: `export const SongItem = memo(function SongItem(props) {...})`
- Use **useCallback()** for event handlers to prevent re-renders
- Use **lazy loading** with React.lazy() for large components
- Props should be interfaces ending in `Props`
- Prefer **controlled components** over uncontrolled ones

### Next.js Specifics
- **Image optimization**: Always include `sizes` prop when using `fill`
  ```tsx
  <Image src="..." fill sizes="(max-width: 640px) 100vw, 50vw" />
  ```
- **Loading states**: Use `loading.tsx` for skeleton UI during data fetch
- **Path aliases**: All imports use `@/*` (don't use relative paths)
- **Server vs Client**: Use `"use client"` for interactive components
- **Dynamic routes**: Follow `/[param]/page.tsx` pattern

### API & Data Fetching
- Use **React Query** for async data (`useQuery`, `useMutation`)
- Cache keys in `lib/cache.ts`: `CACHE_KEYS.SONGS(id)`
- Wrap API responses: `{ success: true, data: [...] }` pattern
- Handle errors gracefully with loading states (skeleton UI first)
- Support offline mode with `useOffline()` hook

### Performance
- Memoize expensive components with `memo()`
- Use `useCallback()` for stable function references
- Lazy load images with `ProgressiveImage` component
- Optimize bundle with Turbopack analysis
- Split code with dynamic imports for large features

### Accessibility (a11y)
- Biome warns on missing ARIA labels, keyboard handlers, semantic HTML
- Use semantic HTML: `<button>`, `<nav>`, `<main>`, not just `<div>`
- Include `aria-label` or `aria-describedby` for icon-only buttons
- Ensure clickable elements have keyboard support

### Styling
- **TailwindCSS** for styling (v4.2.2)
- Use **shadcn/ui** components from `components/ui/`
- Theme support via `next-themes`
- Responsive design: mobile-first with `md:`, `lg:` breakpoints
- Dark mode: Automatic with next-themes context

## Key Architectural Patterns

### File Structure
```
app/               # Next.js app routes (pages, layouts)
components/        # React components
  ui/             # shadcn/ui components (don't modify)
  common/         # Shared components
hooks/            # Custom React hooks
lib/              # Utilities, store, API
  store/          # Zustand state management
  api/            # API client functions
types/            # TypeScript type definitions
```

### State Management Strategy
- **Zustand store** for persistent app state
- **React Query** for server state & async data
- **Local useState** for UI-only state (modals, form inputs)
- **Context** only for theme/locale (avoid excessive nesting)

## Common Issues & Solutions

### Infinite Loops in Zustand
- ✅ **Correct**: `useAppStore.getState().action()` in callbacks
- ❌ **Wrong**: Destructuring store in render: `const { action } = useAppStore()`

### Image Warnings
- Always add `sizes` prop to `<Image fill>`
- Format: `sizes="(max-width: 640px) 100vw, 50vw"`

### TypeScript Errors
- Use `type` for type imports
- Enable strict checks with `as unknown` only when necessary
- Check `tsconfig.json` for path aliases

### Build Failures
- Run `npm run lint` to catch Biome issues
- Run `npm run format` to auto-fix formatting
- Verify all imports use `@/` alias
- Check for circular dependencies in lib/store

## Resources
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [React Query Docs](https://tanstack.com/query/latest)
- [TailwindCSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Biome Docs](https://biomejs.dev)
