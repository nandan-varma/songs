# Songs - Music Streaming PWA

A modern, offline-capable music streaming Progressive Web App built with Next.js 16, React 19, and TypeScript.

## Features

- High-Quality Audio Streaming - Stream songs in multiple quality levels (up to 320kbps)
- Progressive Web App - Install on mobile and desktop with offline capabilities
- Offline Mode - Download songs for offline playback with smart caching
- Advanced Search - Search across songs, albums, artists, and playlists
- Smart Queue Management - Add songs, albums, or playlists to queue
- Local Playlists - Create and manage your own playlists
- Favorites - Save and manage favorite songs
- Playback History - Track recently played songs
- Modern UI - Beautiful interface with dark mode support
- Accessible - Built with accessibility best practices
- Keyboard Shortcuts - Control playback with keyboard (space, arrows, m, etc.)
- Network Aware - Automatically switches to offline mode when connection is lost
- Analytics - Track playback events and user interactions
- Smooth Animations - Motion-powered animations with reduced motion support

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Modern web browser with IndexedDB support

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd songs
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Start development server
   ```bash
   pnpm dev
   ```

4. Open your browser
   Navigate to http://localhost:3000

## Available Scripts

- `pnpm dev` - Start Next.js development server
- `pnpm build` - Create production build
- `pnpm start` - Start production server
- `pnpm lint` - Run Biome linter
- `pnpm format` - Format code with Biome
- `pnpm analyze` - Analyze bundle size (requires ANALYZE=true)
- `pnpm analyze:turbopack` - Analyze with Turbopack

## Architecture

### Tech Stack

- Framework: Next.js 16.1.1 with App Router
- Frontend: React 19.2.3 with TypeScript
- Stylling: Tailwind CSS v4 + Radix UI components
- State Management: React Context API + TanStack React Query v5
- Offline Storage: IndexedDB with custom wrapper
- Linting: Biome
- Animation: Motion
- URL State: nuqs
- Icons: Lucide React

### Key Components

- Audio Player: Persistent player with queue management
- Search System: Global search with suggestions and history
- Offline Manager: Download and cache songs for offline playback
- PWA Features: Service worker, manifest, and install prompts
- Local Playlists: Create and manage custom playlists
- Favorites: Save and manage favorite songs
- Playback History: Track and replay recently played songs
- Keyboard Shortcuts: Global keyboard controls for playback
- Analytics: Event tracking for user interactions

### Data Flow

1. API Layer: Fetches data from external music API (saavn-api.nandanvarma.com)
2. Caching Layer: React Query for server state, IndexedDB for offline content
3. UI Layer: React components with Context API for global state
4. Service Worker: Handles caching and offline functionality

## Development Guidelines

### Code Style

- TypeScript: Strict mode enabled
- Imports: Use `@/` alias for absolute imports
- Naming: PascalCase for components, camelCase for functions
- Formatting: Biome with tabs and double quotes
- Linting: Comprehensive rules for accessibility and performance

### Architecture Patterns

- Context Splitting: Separate high/medium/low frequency contexts
- Custom Hooks: Business logic in `/hooks/` directory
- Component Composition: Reusable UI components in `/components/ui/`
- Error Boundaries: Graceful error handling with contextual messages
- URL State: Use nuqs for URL-based state management
- Animations: Use motion library with reduced motion preferences

### Performance Optimizations

- Bundle analysis with `@next/bundle-analyzer`
- Image optimization with WebP/AVIF support
- Context splitting to prevent unnecessary re-renders
- Progressive loading and lazy loading where appropriate
- Motion animations with performance monitoring

## Configuration

### Environment Variables

The app uses external APIs and doesn't require environment variables for basic functionality. For production deployment, consider:

- Adding API rate limiting
- Implementing error reporting (Sentry)
- Setting up analytics

### PWA Configuration

- Service Worker: `public/sw.js` handles caching strategies
- Manifest: Configure app metadata and icons
- Icons: Multiple sizes available in `public/` directory

## Offline Features

### Download Management

- Download songs in highest available quality
- Automatic image caching for album art
- Storage usage tracking and cleanup
- LRU-style cache management

### Offline Playback

- Seamless switching between online/offline modes
- Cached songs available when offline
- Automatic skipping of unavailable content
- Network status monitoring

## UI Components

Built with Radix UI primitives and Tailwind CSS:

- Accessible: ARIA support and keyboard navigation
- Themeable: Dark/light mode support
- Responsive: Mobile-first design approach
- Consistent: Design system with CSS variables
- Animated: Motion-powered transitions with reduced motion support

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| Left Arrow | Seek backward 10s |
| Right Arrow | Seek forward 10s |
| Up Arrow | Volume up |
| Down Arrow | Volume down |
| M | Toggle mute |
| N | Next track |
| P | Previous track |
| S | Toggle shuffle |
| Q | Toggle queue |

## Security

- Content Security Policy headers (recommended for production)
- Input validation with React Hook Form + Zod
- Secure external API communication
- No inline scripts or dangerous HTML

## Deployment

### Build for Production

```bash
pnpm build
pnpm start
```

### PWA Deployment Checklist

- Add CSP headers to hosting platform
- Configure HTTPS (required for PWA)
- Test offline functionality
- Verify all PWA icons are accessible
- Test on target devices/browsers

### Recommended Hosting Platforms

- Vercel (optimal for Next.js)
- Netlify
- Any static hosting with Node.js support

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

1. Follow the installation steps above
2. Run linting: `pnpm lint`
3. Format code: `pnpm format`
4. Test bundle size: `pnpm analyze`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Music data provided by Saavn API (https://saavn-api.nandanvarma.com)
- UI components built with Radix UI (https://radix-ui.com/)
- Icons from Lucide (https://lucide.dev/)
- Animations powered by Motion (https://motion.dev/)

---

Built with Next.js and React
