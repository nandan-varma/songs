# Quick Start

## Your First Session

### 1. Start the Development Server

```bash
pnpm dev
```

The development server will start at http://localhost:3000

### 2. Explore the App

| Feature | Description |
|---------|-------------|
| Search | Search for songs, albums, artists, playlists |
| Playback | Click any song to start playing |
| Queue | Add songs to queue via context menu |
| Download | Download songs for offline playback |
| Playlists | Create and manage local playlists |
| Favorites | Save songs as favorites |

### 3. Keyboard Shortcuts

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

## Development Workflow

### Making Changes

1. **Create a branch**: `git checkout -b feature/your-feature`
2. **Make changes**: Edit files in `components/`, `hooks/`, etc.
3. **Test changes**: Run `pnpm dev` and verify in browser
4. **Lint and format**: Run `pnpm lint && pnpm format`
5. **Build**: Run `pnpm build` to catch production issues
6. **Commit**: `git commit -m "Add your feature"`

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test
pnpm test -- filename.test.tsx
```

### Building for Production

```bash
# Create production build
pnpm build

# Preview production build
pnpm start
```

## File Locations

| Task | Location |
|------|----------|
| Add component | `components/feature-name/component.tsx` |
| Add hook | `hooks/category/use-feature.ts` |
| Add context | `contexts/feature-context.tsx` |
| Add types | `types/entity/index.ts` |
| Add API call | `lib/api/index.ts` |
| Update navigation | `components/navigation.tsx` |

## Common Development Tasks

### Adding a New Component

```typescript
// components/song/song-item.tsx
"use client";

import { memo } from "react";
import type { DetailedSong } from "@/types/entity";

interface SongItemProps {
	song: DetailedSong;
	onPlay: (song: DetailedSong) => void;
}

export const SongItem = memo(function SongItem({
	song,
	onPlay,
}: SongItemProps) {
	return (
		<div onClick={() => onPlay(song)}>
			<img src={song.image[0]?.url} alt={song.name} />
			<span>{song.name}</span>
		</div>
	);
});
```

### Adding a Custom Hook

```typescript
// hooks/ui/use-local-storage.ts
import { useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
	const [storedValue, setStoredValue] = useState<T>(() => {
		if (typeof window === "undefined") return initialValue;
		try {
			const item = window.localStorage.getItem(key);
			return item ? JSON.parse(item) : initialValue;
		} catch {
			return initialValue;
		}
	});

	const setValue = (value: T | ((val: T) => T)) => {
		try {
			const valueToStore = value instanceof Function
				? value(storedValue)
				: value;
			setStoredValue(valueToStore);
			if (typeof window !== "undefined") {
				window.localStorage.setItem(key, JSON.stringify(valueToStore));
			}
		} catch (error) {
			console.error("Error saving to localStorage:", error);
		}
	};

	return [storedValue, setValue] as const;
}
```

### Adding API Integration

```typescript
// lib/api/index.ts
export async function getSongById(id: string): Promise<DetailedSong> {
	const response = await fetch(`${API_BASE_URL}/songs/${id}`);
	if (!response.ok) {
		throw new Error("Failed to fetch song");
	}
	const data = await response.json();
	return data.data[0];
}
```

## Debugging

### Browser DevTools

1. **Console**: View logs and errors
2. **Network**: Monitor API requests
3. **Application**: Inspect IndexedDB, localStorage
4. **React DevTools**: Inspect component tree and state

### React DevTools

```typescript
// Add debug logging
const Component = () => {
	console.log("Component rendered");

	const state = useSomeState();
	console.log("State:", state);

	return <div>...</div>;
};
```

## Performance

### Bundle Analysis

```bash
ANALYZE=true pnpm build
```

This generates a bundle analysis report showing:
- Largest dependencies
- Duplicate packages
- Code splitting effectiveness

### Performance Monitoring

Use browser DevTools:
- **Performance tab**: Record and analyze performance
- **Lighthouse**: Audit PWA performance
- **Coverage**: Identify unused code

## Next Steps

- Read [Architecture Overview](../architecture/overview.md)
- Learn about [State Management](../architecture/state-management.md)
- Explore [Adding Features](../guides/adding-features.md)
- Check [API Reference](../reference/api.md)
