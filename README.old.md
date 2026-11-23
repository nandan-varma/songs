# Songs

A clean music streaming app — no ads, no subscription walls, and the ability to actually download songs for offline listening. Full stack: a middleware layer, an API surface, and a proper web client on top.

## Features

- Search songs, albums, and playlists
- Stream directly in the browser
- Download tracks for offline use, cached in IndexedDB
- Playlist management with drag-and-drop reordering
- Login to save your library across devices
- Server-side data fetching with TanStack Query

## Architecture

Three layers: client → middleware → data source. The middleware layer insulates the client from the upstream data shape — if the source changes, only the middleware needs updating and the client remains unchanged.

- Downloaded tracks are cached in **IndexedDB** rather than the Cache API, since IndexedDB gives structured, queryable storage with larger quotas and is designed for binary blobs looked up by track ID, not HTTP responses.
- **Zustand** owns player state (playback position, queue); **TanStack Query** owns server state (search results, library, playlists). Keeping them separate avoids putting server data in the player store.

## Getting started

```bash
pnpm install
pnpm dev
```

## Built with

- [Next.js](https://nextjs.org)
- [Drizzle ORM](https://orm.drizzle.team/) + [Neon](https://neon.tech/) — PostgreSQL
- [Better Auth](https://www.better-auth.com/) — authentication
- [Zustand](https://zustand-demo.pmnd.rs/) — client state
- [TanStack Query](https://tanstack.com/query) — server state
- [Tailwind CSS](https://tailwindcss.com)
- Deployed on [Vercel](https://vercel.com)

## Future directions

- Export and import playlists
- Recommendation system based on listening history
