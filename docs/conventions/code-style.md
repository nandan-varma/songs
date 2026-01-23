# Code Style

TypeScript, React, and formatting guidelines for the Songs PWA.

## TypeScript

### Strict Mode

TypeScript strict mode is enabled. Always define types.

```typescript
// GOOD
function greet(name: string): string {
	return `Hello, ${name}`;
}

// BAD
function greet(name) {
	return `Hello, ${name}`;
}
```

### Type Inference

Use inference when types are obvious:

```typescript
// GOOD - type is obvious
const count = 5;
const names = ["Alice", "Bob"];
const config = { timeout: 5000 };

// GOOD - explicit types for function parameters
function processItems(items: Item[]): Result {
	return items.reduce((acc, item) => {
		// ...
	}, {} as Result);
}

// GOOD - complex types should be explicit
interface UserAction {
	type: "click" | "submit" | "hover";
	target: HTMLElement;
	timestamp: number;
}
```

### Type Assertions

Avoid `any`. Use `unknown` when type is truly unknown:

```typescript
// GOOD
function handleData(data: unknown): string {
	if (typeof data === "string") {
		return data;
	}
	throw new Error("Invalid data");
}

// GOOD - type narrowing
function processValue(value: string | number) {
	if (typeof value === "string") {
		return value.toUpperCase();
	}
	return value * 2;
}

// BAD
function handleData(data: any) {
	return data.name;
}
```

## React Components

### Component Structure

```typescript
// GOOD
import { memo } from "react";
import type { ComponentProps } from "@/types/entity";

interface ComponentNameProps {
	title: string;
	onAction: () => void;
	variant?: "primary" | "secondary";
}

export const ComponentName = memo(function ComponentName({
	title,
	onAction,
	variant = "primary",
}: ComponentNameProps) {
	return (
		<button onClick={onAction} data-variant={variant}>
			{title}
		</button>
	);
});
```

### Hooks

```typescript
// GOOD - custom hook
function useForm<T extends Record<string, unknown>>(initialValues: T) {
	const [values, setValues] = useState(initialValues);

	const handleChange = useCallback((name: keyof T, value: unknown) => {
		setValues((prev) => ({ ...prev, [name]: value }));
	}, []);

	return { values, handleChange, setValues };
}

// GOOD - useCallback for stable references
const handleClick = useCallback((event: React.MouseEvent) => {
	onClick(event);
}, [onClick]);
```

### Context

```typescript
// GOOD - provide value object
const value = useMemo(() => ({
	state,
	actions,
}), [state, actions]);

return <Context.Provider value={value}>{children}</Context.Provider>;
```

## Imports

### Order

```typescript
// 1. React
import { useState, useCallback, useMemo } from "react";
import { memo } from "react";

// 2. Next.js
import Link from "next/link";
import { useRouter } from "next/navigation";

// 3. External libraries
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "motion/react";

// 4. Absolute imports (components)
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 5. Absolute imports (hooks)
import { usePlayer } from "@/contexts/player-context";
import { useQueue } from "@/contexts/queue-context";

// 6. Absolute imports (types)
import type { DetailedSong } from "@/types/entity";

// 7. Relative imports
import { formatTime } from "@/lib/utils/time";
import { logError } from "@/lib/utils/error";
```

### Named vs Default

```typescript
// GOOD - named imports
import { useState, useCallback } from "react";
import { Button, Card, Modal } from "@/components/ui";

// GOOD - default import for main component
import AudioPlayer from "@/components/audio-player";

// GOOD - aliased import
import { usePlayer as usePlayback } from "@/contexts/player-context";
```

## Naming

### Variables and Functions

```typescript
// GOOD - camelCase
const currentSong = null;
const isPlaying = false;
const getSongById = (id: string) => Song | undefined;

// GOOD - descriptive names
const isOfflineModeEnabled = true;
const handleSongPlayback = () => void;

// BAD - abbreviated
const cS = null;
const ip = false;
```

### Constants

```typescript
// GOOD - UPPER_SNAKE_CASE for constants
const MAX_QUEUE_SIZE = 100;
const DEFAULT_VOLUME = 0.7;
const API_BASE_URL = "https://api.example.com";

// GOOD - camelCase for enum-like objects
const AudioQuality = {
	LOW: "48kbps",
	MEDIUM: "96kbps",
	HIGH: "160kbps",
} as const;
```

### Interfaces and Types

```typescript
// GOOD - PascalCase for interfaces
interface PlayerState {
	currentSong: DetailedSong | null;
	isPlaying: boolean;
}

// GOOD - prefix with functionality
interface PlaybackContextValue {
	playSong: (song: DetailedSong) => void;
	pauseSong: () => void;
}
```

## File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | kebab-case | `song-item.tsx`, `audio-player.tsx` |
| Hooks | `use-*` prefix, kebab-case | `use-audio-playback.ts` |
| Contexts | kebab-case | `player-context.tsx` |
| Utilities | camelCase | `time.ts`, `audio-error.ts` |
| Types | PascalCase | `PlayerState.ts`, `SongTypes.ts` |

## Formatting

### Quotes

```typescript
// GOOD - double quotes
const name = "John";
const path = "/api/songs";

// GOOD - single quotes for JSX
return <div className="container">{message}</div>;
```

### Semicolons

```typescript
// Use semicolons
const result = doSomething();
```

### Tabs

```typescript
// Use tabs for indentation
function example() {
	const value = "indented with tab";
}
```

## Performance

### Memoization

```typescript
// GOOD - memoize expensive calculations
const processedData = useMemo(() => {
	return data.map(transform).filter(predicate);
}, [data, transform, predicate]);

// GOOD - memoize callbacks
const handleClick = useCallback((id: string) => {
	onItemClick(id);
}, [onItemClick]);
```

### Lazy Loading

```typescript
// GOOD - lazy load heavy components
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("./heavy-component"), {
	loading: () => <p>Loading...</p>,
	ssr: false,
});
```

## Accessibility

### ARIA Labels

```typescript
// GOOD - with aria-label
<button
	onClick={handlePlay}
	aria-label={isPlaying ? "Pause" : "Play"}
>
	{isPlaying ? <PauseIcon /> : <PlayIcon />}
</button>

// GOOD - with aria-label for icon-only buttons
<button
	onClick={handleMute}
	aria-label={isMuted ? "Unmute" : "Mute"}
>
	{isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
</button>
```

### Semantic HTML

```typescript
// GOOD - semantic elements
<main>
	<header>
		<h1>Song Title</h1>
	</header>
	<article>
		<section>
			<h2>Lyrics</h2>
		</section>
	</article>
	<footer>
		<p>Copyright 2024</p>
	</footer>
</main>
```

## Comments

### JSDoc

```typescript
/**
 * ComponentName - Brief description of the component
 *
 * @component
 * @example
 * ```tsx
 * <ComponentName title="Click me" onAction={() => console.log('clicked')} />
 * ```
 *
 * @see {@link https://example.com/docs|External Documentation}
 */
export const ComponentName = () => {};
```

### Inline Comments

```typescript
// GOOD - explanatory comments
// Reset playback position when song changes
audio.currentTime = 0;

// BAD - obvious comments
// Increment counter
counter = counter + 1;
```

## Error Handling

### Try/Catch

```typescript
// GOOD - with error handling
async function fetchData(id: string): Promise<Data> {
	try {
		const response = await fetch(`/api/data/${id}`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return response.json();
	} catch (error) {
		console.error("Failed to fetch data:", error);
		throw error;
	}
}

// GOOD - returning default on error
function getSafeValue<T>(value: T | null, defaultValue: T): T {
	try {
		return value ?? defaultValue;
	} catch {
		return defaultValue;
	}
}
```

### Toast Notifications

```typescript
import { toast } from "sonner";

// GOOD - success
toast.success("Song downloaded successfully");

// GOOD - error
toast.error("Failed to download song");

// GOOD - info
toast.info("Song added to queue");
```
