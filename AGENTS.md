# Agent Instructions for Songs App

## Commands
- **Development**: `pnpm dev` - Start Next.js dev server
- **Build**: `pnpm build` - Create production build
- **Start**: `pnpm start` - Start production server
- **Lint**: `pnpm lint` - Run Biome linter
- **Format**: `pnpm format` - Format code with Biome
- **Analyze**: `pnpm analyze` - Analyze bundle size (requires ANALYZE=true env var)
- **Analyze Turbopack**: `pnpm analyze:turbopack` - Analyze bundle with Turbopack
- **Test**: No test framework configured yet

## Code Style Guidelines

### Framework & Language
- **Framework**: Next.js 16 with App Router, React 19
- **Language**: TypeScript with strict mode enabled
- **Linting/Formatting**: Biome (tabs, double quotes, recommended rules)

### Imports & Structure
- Use `@/` alias for absolute imports
- Group imports: React, external libs, internal components/hooks, types
- One import per line for clarity

### Naming Conventions
- **Components**: PascalCase (e.g., `SongItem`, `AudioPlayer`)
- **Functions/Variables**: camelCase (e.g., `downloadSong`, `isPlaying`)
- **Types/Interfaces**: PascalCase with descriptive names (e.g., `DetailedSong`, `PlayerActions`)
- **Files**: kebab-case for components (e.g., `song-item.tsx`), camelCase for utilities

### React Patterns
- Functional components with hooks
- Custom hooks in `/hooks/` directory
- Context API for global state (split contexts to minimize re-renders)
- TanStack React Query for server state

### Error Handling
- Use try/catch with toast notifications (sonner)
- Silent errors in non-critical paths (prefix with `_`)
- Avoid console statements in production

### Styling
- Tailwind CSS with Radix UI components
- Custom UI components in `/components/ui/`
- Responsive design with mobile-first approach

### Types & APIs
- Strict TypeScript with comprehensive interfaces
- External API calls with proper error handling
- IndexedDB for offline storage via custom wrapper

### Accessibility
- Semantic HTML elements
- ARIA props where needed
- Keyboard navigation support
- Media Session API for system controls
- Focus management and screen reader support

### Advanced Patterns

#### Context Splitting Strategy
Split contexts into 3 tiers to minimize re-renders:
- **PlaybackContext**: High-frequency updates (currentTime, volume, isPlaying)
- **QueueContext**: Medium-frequency updates (queue modifications)
- **PlayerActionsContext**: Stable function references (never changes)

#### Offline Architecture
- IndexedDB with LRU-style caching for song storage
- Service Worker with multiple cache strategies
- Automatic network status detection
- Blob URL management with proper cleanup

#### Performance Optimizations
- React Query with appropriate stale times (10min for metadata, 1min for search)
- Image optimization with WebP/AVIF support
- Bundle analysis and tree-shaking
- Progressive loading and lazy loading

### Error Handling Patterns
- Contextual error boundaries with retry mechanisms
- Toast notifications for user-facing errors
- Silent error handling for non-critical operations
- Development error details display

### Security Considerations
- No `dangerouslySetInnerHTML` usage
- Image domains restricted in Next.js config
- External API communication with proper error handling
- CSP headers recommended for production

### PWA Features
- Service worker for offline caching
- Comprehensive icon set for all platforms
- Install prompts and offline fallbacks
- Manifest configuration for app metadata

### Build & Deployment
- Bundle analyzer integration
- Experimental Next.js features enabled
- Static asset optimization
- Production-ready error boundaries