# Adding New Features Guide

This guide outlines the steps to add a new feature to the Songs PWA.

## Feature Addition Checklist

### 1. Plan the Feature

Before writing code, define:
- **Purpose**: What problem does this feature solve?
- **Scope**: What is included and excluded?
- **Dependencies**: What other features/components does it need?
- **UI/UX**: Wireframes or design concepts

### 2. Create Directory Structure

```bash
# Create component directory
touch components/feature-name/component-name.tsx

# Create hook directory (if needed)
touch hooks/category/use-feature-name.ts

# Create types (if needed)
# Add to types/entity/index.ts or types/api/index.ts
```

### 3. Create Components

Example for a "favorites" feature:

```typescript
// components/favorites/favorite-button.tsx
"use client";

import { memo, useCallback } from "react";

interface FavoriteButtonProps {
	isFavorite: boolean;
	onToggle: () => void;
}

export const FavoriteButton = memo(function FavoriteButton({
	isFavorite,
	onToggle,
}: FavoriteButtonProps) {
	return (
		<button onClick={onToggle}>
			{isFavorite ? "❤️" : "🤍"}
		</button>
	);
});
```

### 4. Create Hooks

```typescript
// hooks/data/use-favorites.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DetailedSong } from "@/types/entity";

export function useFavorites() {
	return useQuery({
		queryKey: ["favorites"],
		queryFn: async () => {
			// Fetch favorites from API or local storage
		},
	});
}

export function useAddFavorite() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (song: DetailedSong) => {
			// Add song to favorites
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["favorites"] });
		},
	});
}
```

### 5. Update Types

Add to `types/entity/index.ts`:

```typescript
export interface Favorite {
	id: string;
	songId: string;
	createdAt: Date;
}

export interface FavoritesResponse {
	favorites: Favorite[];
	total: number;
}
```

### 6. Create Context (if needed)

```typescript
// contexts/favorites-context.tsx
"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useFavorites, useAddFavorite, useRemoveFavorite } from "@/hooks/data/use-favorites";

interface FavoritesContextType {
	favorites: DetailedSong[];
	isLoading: boolean;
	addFavorite: (song: DetailedSong) => void;
	removeFavorite: (songId: string) => void;
	isFavorite: (songId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
	const { data: favorites = [], isLoading } = useFavorites();
	const addMutation = useAddFavorite();
	const removeMutation = useRemoveFavorite();

	const value = useMemo(() => ({
		favorites: favorites.map((f) => f.song),
		isLoading,
		addFavorite: addMutation.mutate,
		removeFavorite: removeMutation.mutate,
		isFavorite: (songId: string) => favorites.some((f) => f.songId === songId),
	}), [favorites, isLoading, addMutation, removeMutation]);

	return (
		<FavoritesContext.Provider value={value}>
			{children}
		</FavoritesContext.Provider>
	);
}

export function useFavorites() {
	const context = useContext(FavoritesContext);
	if (!context) {
		throw new Error("useFavorites must be used within a FavoritesProvider");
	}
	return context;
}
```

### 7. Create Page

```typescript
// app/favorites/page.tsx
import { FavoritesPage } from "./favorites-page";

export default function Page() {
	return <FavoritesPage />;
}
```

```typescript
// app/favorites/favorites-page.tsx
"use client";

import { useFavorites } from "@/contexts/favorites-context";
import { SongItem } from "@/components/song/song-item";

export function FavoritesPage() {
	const { favorites, isLoading } = useFavorites();

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div>
			<h1>Your Favorites</h1>
			{favorites.map((song) => (
				<SongItem key={song.id} song={song} />
			))}
		</div>
	);
}
```

### 8. Update Navigation

```typescript
// components/navigation.tsx
import Link from "next/link";

export function Navigation() {
	return (
		<nav>
			<Link href="/favorites">Favorites</Link>
		</nav>
	);
}
```

### 9. Add to Providers

```typescript
// app/providers.tsx
import { FavoritesProvider } from "@/contexts/favorites-context";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<FavoritesProvider>
			{children}
		</FavoritesProvider>
	);
}
```

### 10. Write Tests

```typescript
// tests/components/favorite-button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { FavoriteButton } from "@/components/favorites/favorite-button";

describe("FavoriteButton", () => {
	it("toggles favorite state", () => {
		const onToggle = vi.fn();
		render(<FavoriteButton isFavorite={false} onToggle={onToggle} />);

		fireEvent.click(screen.getByRole("button"));
		expect(onToggle).toHaveBeenCalled();
	});
});
```

### 11. Run Lint and Build

```bash
pnpm lint
pnpm build
```

## Best Practices

### Component Design
- Use functional components with hooks
- Memoize expensive components with `React.memo()`
- Use TypeScript for type safety
- Follow the single responsibility principle

### State Management
- Use React Query for server state
- Use Context for global UI state
- Use local state for component-specific state
- Avoid overusing Context (causes re-renders)

### Performance
- Lazy load routes with `dynamic()`
- Memoize callbacks with `useCallback()`
- Memoize values with `useMemo()`
- Use proper key props in lists

### Error Handling
- Use Error Boundaries for component errors
- Show user-friendly error messages
- Log errors for debugging
- Provide retry mechanisms

### Accessibility
- Use semantic HTML
- Add ARIA labels where needed
- Support keyboard navigation
- Test with screen readers

## Common Patterns

### Feature Flagging
```typescript
const isFeatureEnabled = process.env.NEXT_PUBLIC_FEATURE_FAVORITES === "true";

if (isFeatureEnabled) {
	// Render feature
}
```

### Feature Detection
```typescript
if ("serviceWorker" in navigator) {
	// Register service worker
}
```

### Graceful Degradation
```typescript
if (!navigator.onLine) {
	return <OfflineFallback />;
}
```

## Review Checklist

Before submitting a feature:

- [ ] Code follows project conventions
- [ ] Types are properly defined
- [ ] Error handling is implemented
- [ ] Accessibility requirements are met
- [ ] Tests are written
- [ ] Lint passes
- [ ] Build succeeds
- [ ] Documentation is updated
- [ ] No console.log in production
