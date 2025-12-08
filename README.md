# Music Streaming App

A modern, progressive web app for streaming music with offline capabilities. Built with Next.js 16, React 19, and TypeScript.

## Features

- **Global Search**: Search across songs, albums, artists, and playlists
- **Audio Playback**: Persistent player with queue management and media session integration
- **Offline Mode**: Download songs for offline listening with IndexedDB storage
- **PWA**: Installable app with service worker caching
- **Responsive Design**: Mobile-first approach with desktop optimizations

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **State Management**: React Context API with TanStack Query
- **Database**: IndexedDB for offline storage
- **Audio**: HTML5 Audio API with Media Session API
- **PWA**: Service Worker, Web App Manifest

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd songs
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm build
pnpm start
```

## Project Structure

```
app/                 # Next.js app router pages
components/          # Reusable UI components
contexts/           # React context providers
hooks/              # Custom React hooks
lib/                # Utilities, API client, types
public/             # Static assets and service worker
```

## API

The app integrates with the JioSaavn API (`https://saavn-api.nandanvarma.com/api`) for music data. No authentication required for public endpoints.

## Offline Functionality

- Download songs to IndexedDB for offline playback
- Automatic network detection
- Service worker caches static assets and images
- Background sync for failed operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.