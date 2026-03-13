# Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Pages      │  │ Components  │  │ Audio Player            │  │
│  │  (Next.js)  │  │  (React)    │  │  (Persistent)           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Context Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Player     │  │  Queue      │  │  Favorites              │  │
│  │  Context    │  │  Context    │  │  Context                │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  History    │  │  Downloads  │  │  Local Playlists        │  │
│  │  Context    │  │  Context    │  │  Context                │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     State Management                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  React Query (Server State)                             │    │
│  │  - Song/Album/Artist/Playlist data                      │    │
│  │  - Search results                                       │    │
│  │  - Caching with staleTime/gcTime                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  IndexedDB (Persistent Storage)                         │    │
│  │  - Downloaded songs (blobs)                             │    │
│  │  - Playback history                                     │    │
│  │  - Favorites                                            │    │
│  │  - Local playlists                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  LocalStorage (Preferences)                             │    │
│  │  - Theme preference                                     │    │
│  │  - Animation preferences                                │    │
│  │  - Volume settings                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        External Services                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Saavn API                                              │    │
│  │  - Song metadata                                        │    │
│  │  - Album/Artist/Playlist data                           │    │
│  │  - Search functionality                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Service Worker                                         │    │
│  │  - Offline caching                                      │    │
│  │  - Network interception                                 │    │
│  │  - Background sync                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 16.1.1 | SSR, routing, optimization |
| UI Library | React 19.2.3 | Component-based UI |
| Language | TypeScript 5.9.3 | Type safety |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| Components | Radix UI | Accessible primitives |
| State (Server) | TanStack Query v5 | Data fetching, caching |
| State (UI) | React Context | Global UI state |
| Storage | IndexedDB | Offline data storage |
| Animation | Motion | Animations |
| URL State | nuqs | URL-based state |
| Icons | Lucide React | Icon library |
| Notifications | Sonner | Toast notifications |
| Forms | React Hook Form + Zod | Form handling |
| Linting | Biome | Code quality |

## Data Flow

### User Action Flow

```
User clicks play
        │
        ▼
Component calls player action
        │
        ▼
PlayerContext updates state
        │
        ├──▶ Audio element starts playing
        │        │
        │        ▼
        │   Event listeners fire
        │        │
        │        ▼
        │   State updates (currentTime, duration)
        │        │
        │        ▼
        │   UI re-renders (progress bar, time display)
        │
        ▶ QueueContext updates
        │
        ▼
HistoryContext records playback
```

### Search Flow

```
User enters search query
        │
        ▼
Debounced input triggers search
        │
        ▼
useSearchSuggestions hook provides suggestions
        │
        ▼
User selects result
        │
        ▼
Page-specific hook fetches data
        │
        ├──▶ React Query caches result
        │
        ▼
Component displays data
```

### Offline Flow

```
User enables offline mode
        │
        ▼
OfflineContext detects network state
        │
        ▼
UI switches to offline mode
        │
        ├──▶ Downloaded songs only
        │        │
        │        ▼
        │   IndexedDB queried
        │        │
        │        ▼
        │   Blob URLs created
        │        │
        │        ▼
        │   Audio plays from cache
        │
        ▼
Toast notification shows offline status
```

## Component Hierarchy

```
app/
├── layout.tsx          # Root layout with providers
├── page.tsx           # Home page
├── providers.tsx      # Context providers wrapper
├── error.tsx          # Error boundary
└── (routes)/
    ├── album/[id]/page.tsx
    ├── artist/[id]/page.tsx
    ├── downloads/page.tsx
    ├── library/page.tsx
    ├── playlist/[id]/page.tsx
    └── song/[id]/page.tsx

components/
├── ui/                # Base UI components (Radix-based)
├── common/            # Shared components
├── player/            # Audio player components
├── song/              # Song-related components
├── album/             # Album-related components
├── artist/            # Artist-related components
├── playlist/          # Playlist-related components
└── search/            # Search-related components
```

## State Architecture

### Context Tiers

The app uses a tiered context approach to minimize unnecessary re-renders:

| Tier | Context | Update Frequency | Example State |
|------|---------|------------------|---------------|
| High | PlaybackContext | ~10/sec | currentTime, isPlaying |
| Medium | QueueContext | On action | queue, currentIndex |
| Stable | PlayerActionsContext | Never | playSong, seekTo |

### React Query Configuration

```typescript
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 10, // 10 minutes
			gcTime: 1000 * 60 * 60,    // 1 hour
			retry: 3,
			refetchOnWindowFocus: false,
		},
	},
});
```

## Performance Optimizations

### Rendering

- **Context splitting**: Prevents unnecessary re-renders
- **Memoization**: useMemo, useCallback, React.memo
- **Code splitting**: Lazy loading routes
- **Virtual scrolling**: For long lists

### Caching

- **React Query**: Server state caching
- **IndexedDB**: Persistent offline storage
- **Service Worker**: Static asset caching

### Bundle

- **Tree shaking**: Unused code elimination
- **Dynamic imports**: On-demand loading
- **Bundle analysis**: Identify large dependencies

## PWA Features

### Service Worker

The Service Worker handles:
- Network request interception
- Static asset caching (cache-first)
- API response caching (network-first)
- Offline fallback pages
- Background sync for downloads

### Manifest

The web manifest defines:
- App name and description
- Theme colors
- Icons (multiple sizes)
- Display mode (standalone)
- Start URL

### Install Prompt

The app prompts users to install:
- On mobile browsers
- On desktop browsers (Chrome, Edge)
- After user interaction
- Respects user preference

## Security

- **CSP**: Content Security Policy headers
- **Input Validation**: Zod schemas
- **HTTPS**: Required for Service Workers
- **No Sensitive Data**: No credentials in code
