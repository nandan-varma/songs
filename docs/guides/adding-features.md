# Adding Features

A comprehensive guide to adding new features to the Songs PWA.

## Feature Addition Process

### 1. Plan the Feature

Before writing code, define:

- **Purpose**: What problem does this feature solve?
- **Scope**: What is included and excluded?
- **Dependencies**: What other features/components does it need?
- **UI/UX**: Wireframes or design concepts
- **State**: What state needs to be managed and where?

### 2. Create Directory Structure

```bash
# Create component directory
mkdir -p components/feature-name

# Create hook directory (if needed)
mkdir -p hooks/category

# Contexts go in existing contexts/ directory
# Types go in types/entity/index.ts or types/api/index.ts
```

### 3. Add Components

Example for a "radio" feature:

```typescript
// components/radio/radio-player.tsx
"use client";

import { memo, useCallback } from "react";
import type { DetailedSong } from "@/types/entity";

interface RadioPlayerProps {
	stationId: string;
	onSongChange: (song: DetailedSong) => void;
}

export const RadioPlayer = memo(function RadioPlayer({
	stationId,
	onSongChange,
}: RadioPlayerProps) {
	const handleSongPlay = useCallback((song: DetailedSong) => {
		onSongChange(song);
	}, [onSongChange]);

	return (
		<div className="radio-player">
			<h2>Radio Station</h2>
			<button onClick={() => playStation(stationId)}>
				Play
			</button>
		</div>
	);
});
```

### 4. Add Hooks

```typescript
// hooks/data/use-radio.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DetailedSong } from "@/types/entity";

interface RadioStation {
	id: string;
	name: string;
	genre: string;
}

export function useRadioStation(stationId: string) {
	return useQuery({
		queryKey: ["radio", stationId],
		queryFn: () => getRadioStation(stationId),
		enabled: !!stationId,
	});
}

export function usePlayRadio() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (stationId: string) => {
			const response = await fetch(`/api/radio/${stationId}/play`);
			return response.json();
		},
		onSuccess: (data) => {
			// Update queue with radio songs
		},
	});
}
```

### 5. Update Types

Add to `types/entity/index.ts`:

```typescript
export interface RadioStation {
	id: string;
	name: string;
	genre: string;
	language: Language;
	songCount: number;
	image: Image[];
}

export interface RadioResponse {
	station: RadioStation;
	currentSong: DetailedSong;
	upcomingSongs: DetailedSong[];
}
```

### 6. Create Context (if needed)

For local state that needs to be shared:

```typescript
// contexts/radio-context.tsx
"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { DetailedSong, RadioStation } from "@/types/entity";

interface RadioContextType {
	isPlaying: boolean;
	currentStation: RadioStation | null;
	currentSong: DetailedSong | null;
	startStation: (station: RadioStation) => void;
	stopStation: () => void;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export function RadioProvider({ children }: { children: ReactNode }) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
	const [currentSong, setCurrentSong] = useState<DetailedSong | null>(null);

	const startStation = useCallback((station: RadioStation) => {
		setCurrentStation(station);
		setIsPlaying(true);
	}, []);

	const stopStation = useCallback(() => {
		setCurrentStation(null);
		setCurrentSong(null);
		setIsPlaying(false);
	}, []);

	const value = useMemo(() => ({
		isPlaying,
		currentStation,
		currentSong,
		startStation,
		stopStation,
	}), [isPlaying, currentStation, currentSong, startStation, stopStation]);

	return (
		<RadioContext.Provider value={value}>
			{children}
		</RadioContext.Provider>
	);
}

export function useRadio() {
	const context = useContext(RadioContext);
	if (!context) {
		throw new Error("useRadio must be used within a RadioProvider");
	}
	return context;
}
```

### 7. Add to Providers

```typescript
// app/providers.tsx
import { RadioProvider } from "@/contexts/radio-context";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<RadioProvider>
			{children}
		</RadioProvider>
	);
}
```

### 8. Create Page

```typescript
// app/radio/page.tsx
import { RadioPage } from "./radio-page";

export default function Page() {
	return <RadioPage />;
}
```

```typescript
// app/radio/radio-page.tsx
"use client";

import { RadioPlayer } from "@/components/radio/radio-player";

export function RadioPage() {
	return (
		<main>
			<h1>Radio</h1>
			<RadioPlayer stationId="stations" />
		</main>
	);
}
```

### 9. Update Navigation

```typescript
// components/navigation.tsx
import Link from "next/link";

export function Navigation() {
	return (
		<nav>
			<Link href="/radio">Radio</Link>
		</nav>
	);
}
```

### 10. Add Keyboard Shortcuts (if needed)

```typescript
// hooks/ui/use-radio-shortcuts.ts
import { useEffect } from "react";
import { useRadio } from "@/contexts/radio-context";

export function useRadioShortcuts() {
	const { isPlaying, startStation, stopStation } = useRadio();

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Handle radio-specific shortcuts
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isPlaying, startStation, stopStation]);
}
```

### 11. Add Analytics (if needed)

```typescript
// hooks/ui/use-radio-analytics.ts
import { useAnalytics } from "@/hooks/ui/use-analytics";

export function useRadioAnalytics() {
	const { trackEvent } = useAnalytics();

	const trackRadioAction = (action: string, data?: Record<string, unknown>) => {
		trackEvent("radio_action", { action, ...data });
	};

	return { trackRadioAction };
}
```

### 12. Write Tests

```typescript
// tests/components/radio-player.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { RadioPlayer } from "@/components/radio/radio-player";

describe("RadioPlayer", () => {
	it("renders station name", () => {
		render(<RadioPlayer stationId="test" onSongChange={vi.fn()} />);
		expect(screen.getByText("Radio Station")).toBeInTheDocument();
	});

	it("calls onSongChange when song plays", () => {
		const onSongChange = vi.fn();
		render(<RadioPlayer stationId="test" onSongChange={onSongChange} />);
		fireEvent.click(screen.getByRole("button", { name: /play/i }));
	});
});
```

### 13. Run Lint and Build

```bash
pnpm lint
pnpm format
pnpm build
```

## Best Practices

### Component Design

- Use functional components with hooks
- Memoize with `React.memo()` for expensive components
- Use TypeScript for type safety
- Follow single responsibility principle
- Use motion library for animations

### State Management

- Use React Query for server state
- Use Context for global UI state
- Use local state for component-specific state
- Avoid overusing Context (causes re-renders)
- Consider 3-tier context pattern for complex state

### Performance

- Lazy load routes with `dynamic()`
- Memoize callbacks with `useCallback()`
- Memoize values with `useMemo()`
- Use proper key props in lists
- Consider `nuqs` for URL-based state

### Error Handling

- Use Error Boundaries for component errors
- Show user-friendly error messages
- Log errors for debugging
- Provide retry mechanisms
- Use toast notifications for feedback

### Accessibility

- Use semantic HTML
- Add ARIA labels where needed
- Support keyboard navigation
- Test with screen readers
- Respect reduced motion preferences

### Offline Considerations

- Check `useOffline()` before making API calls
- Provide offline fallback UI
- Cache data for offline use
- Handle network state changes gracefully

## Common Patterns

### Feature Flagging

```typescript
const isFeatureEnabled =
	process.env.NEXT_PUBLIC_FEATURE_RADIO === "true";

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

### IndexedDB Storage

```typescript
// For offline data storage
import { openDB } from "@/lib/db";

async function saveToLocalDB(key: string, data: unknown) {
	const db = await openDB("songs-db", 1);
	await db.put("localData", data, key);
}
```

### Animation with Motion

```typescript
import { motion } from "motion/react";
import { useAnimationPreferences } from "@/hooks/ui/use-animation-preferences";

function AnimatedComponent() {
	const { shouldReduceMotion } = useAnimationPreferences();

	return (
		<motion.div
			animate={{ opacity: 1 }}
			initial={{ opacity: 0 }}
			transition={{
				duration: shouldReduceMotion ? 0 : 0.3
			}}
		/>
	);
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
- [ ] Animation respects reduced motion
- [ ] Keyboard shortcuts are registered (if applicable)
- [ ] Analytics tracking is added (if applicable)
- [ ] Offline behavior is tested
