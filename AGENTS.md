# Agent Instructions for Songs App

## Commands
- **Development**: `npm run dev` - Start Next.js dev server
- **Build**: `npm run build` - Create production build
- **Lint**: `npm run lint` - Run Biome linter
- **Format**: `npm run format` - Format code with Biome
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