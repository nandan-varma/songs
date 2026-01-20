# Testing Guidelines

This document outlines the testing practices for the Songs PWA.

## Testing Stack

- **Unit Testing**: Vitest or Jest
- **Component Testing**: React Testing Library
- **E2E Testing**: Playwright or Cypress
- **Type Checking**: TypeScript
- **Linting**: Biome
- **Formatting**: Biome

## Test Structure

```
tests/
├── components/
│   └── feature-name/
│       ├── component-name.test.tsx
│       └── component-name.e2e.test.tsx
├── hooks/
│   └── use-hook-name.test.ts
├── contexts/
│   └── context-name.test.tsx
├── utils/
│   └── utility-name.test.ts
├── integration/
│   └── feature-name.test.tsx
└── fixtures/
    ├── mock-data.json
    └── test-utils.tsx
```

## Writing Tests

### Component Tests

```typescript
// tests/components/song-item.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { SongItem } from "@/components/song/song-item";
import type { Song } from "@/types/entity";

const mockSong: Song = {
	id: "1",
	title: "Test Song",
	image: [{ quality: "500x500", url: "/test.jpg" }],
	album: "Test Album",
	url: "https://test.com/song.mp3",
	type: "song",
	description: "A test song",
	primaryArtists: "Test Artist",
	singers: "Test Singer",
	language: "english",
};

describe("SongItem", () => {
	it("renders song title", () => {
		render(
			<SongItem
				song={mockSong}
				onPlay={vi.fn()}
				onAddToQueue={vi.fn()}
			/>
		);
		expect(screen.getByText("Test Song")).toBeInTheDocument();
	});

	it("calls onPlay when play button is clicked", () => {
		const onPlay = vi.fn();
		render(
			<SongItem
				song={mockSong}
				onPlay={onPlay}
				onAddToQueue={vi.fn()}
			/>
		);
		fireEvent.click(screen.getByRole("button", { name: /play/i }));
		expect(onPlay).toHaveBeenCalledWith(mockSong);
	});

	it("disables buttons when loading", () => {
		render(
			<SongItem
				song={mockSong}
				onPlay={vi.fn()}
				onAddToQueue={vi.fn()}
				isLoading={true}
			/>
		);
		expect(screen.getByRole("button", { name: /play/i })).toBeDisabled();
	});
});
```

### Hook Tests

```typescript
// tests/hooks/use-audio-playback.test.ts
import { renderHook, act } from "@testing-library/react";
import { useAudioPlayback } from "@/hooks/audio/use-audio-playback";

describe("useAudioPlayback", () => {
	it("updates play state when isPlaying changes", () => {
		const audioRef = { current: { play: vi.fn(), pause: vi.fn() } };
		
		const { rerender } = renderHook(
			({ isPlaying }) => useAudioPlayback({ audioRef, isPlaying }),
			{ initialProps: { isPlaying: false } }
		);
		
		rerender({ isPlaying: true });
		expect(audioRef.current.play).toHaveBeenCalled();
	});

	it("pauses audio when isPlaying is false", () => {
		const audioRef = { current: { play: vi.fn(), pause: vi.fn() } };
		
		const { rerender } = renderHook(
			({ isPlaying }) => useAudioPlayback({ audioRef, isPlaying }),
			{ initialProps: { isPlaying: true } }
		);
		
		rerender({ isPlaying: false });
		expect(audioRef.current.pause).toHaveBeenCalled();
	});
});
```

### Context Tests

```typescript
// tests/contexts/player-context.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { PlayerProvider, usePlayer } from "@/contexts/player-context";

describe("PlayerProvider", () => {
	it("provides playback state", () => {
		let playerState: any;
		
		const TestComponent = () => {
			playerState = usePlayer();
			return <button onClick={() => playerState.togglePlayPause()}>Play</button>;
		};
		
		render(
			<PlayerProvider>
				<TestComponent />
			</PlayerProvider>
		);
		
		expect(playerState.isPlaying).toBe(false);
	});

	it("updates play state when togglePlayPause is called", () => {
		let playerState: any;
		
		const TestComponent = () => {
			playerState = usePlayer();
			return <button onClick={() => playerState.togglePlayPause()}>Play</button>;
		};
		
		const { container } = render(
			<PlayerProvider>
				<TestComponent />
			</PlayerProvider>
		);
		
		const button = container.querySelector("button");
		fireEvent.click(button!);
		
		expect(playerState.isPlaying).toBe(true);
	});
});
```

### Utility Tests

```typescript
// tests/utils/time.test.ts
import { formatTime, percentToVolume } from "@/lib/utils/time";

describe("formatTime", () => {
	it("formats seconds to MM:SS", () => {
		expect(formatTime(65)).toBe("1:05");
		expect(formatTime(0)).toBe("0:00");
		expect(formatTime(180)).toBe("3:00");
	});

	it("handles NaN", () => {
		expect(formatTime(NaN)).toBe("0:00");
	});
});

describe("percentToVolume", () => {
	it("converts percentage to volume", () => {
		expect(percentToVolume(50)).toBe(0.5);
		expect(percentToVolume(100)).toBe(1);
		expect(percentToVolume(0)).toBe(0);
	});

	it("clamps values", () => {
		expect(percentToVolume(150)).toBe(1);
		expect(percentToVolume(-10)).toBe(0);
	});
});
```

## Test Utilities

```typescript
// tests/fixtures/test-utils.tsx
import type { RenderOptions } from "@testing-library/react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlayerProvider } from "@/contexts/player-context";
import { OfflineProvider } from "@/contexts/offline-context";
import type { ReactNode } from "react";

const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
			},
		},
	});

interface TestWrapperProps {
	children: ReactNode;
}

function TestWrapper({ children }: TestWrapperProps) {
	const queryClient = createTestQueryClient();
	
	return (
		<QueryClientProvider client={queryClient}>
			<PlayerProvider>
				<OfflineProvider>
					{children}
				</OfflineProvider>
			</PlayerProvider>
		</QueryClientProvider>
	);
}

export function renderWithProviders(
	ui: ReactNode,
	options?: RenderOptions
) {
	return render(ui, {
		wrapper: TestWrapper,
		...options,
	});
}

// Mock audio element
export function createMockAudioElement() {
	return {
		play: vi.fn().mockResolvedValue(undefined),
		pause: vi.fn(),
		load: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		get currentTime() { return 0; },
		set currentTime(v) {},
		get duration() { return 180; },
		get paused() { return true; },
		get readyState() { return 4; },
		get error() { return null; },
	};
}
```

## Mocking

### API Mocking

```typescript
// tests/mocks/api.ts
import { rest } from "msw";
import { setupServer } from "msw/node";

export const server = setupServer(
	rest.get("https://saavn-api.nandanvarma.com/api/songs/:id", (req, res, ctx) => {
		return res(
			ctx.json({
				success: true,
				data: [{
					id: req.params.id,
					name: "Mock Song",
					// ... other fields
				}],
			})
		);
	}),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Module Mocking

```typescript
vi.mock("@/hooks/data/queries", () => ({
	useSong: vi.fn(() => ({
		data: [{ id: "1", name: "Mock Song" }],
		isLoading: false,
	})),
}));
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test -- SongItem.test.tsx

# Run tests by pattern
pnpm test -- --testNamePattern="render"
```

## Test Coverage

```bash
# Generate coverage report
pnpm test:coverage

# View coverage report
open coverage/index.html
```

## Best Practices

### Test Behavior, Not Implementation

```typescript
// GOOD - Tests behavior
it("plays song when play button is clicked", () => {
	render(<SongItem song={song} onPlay={onPlay} />);
	fireEvent.click(screen.getByRole("button", { name: /play/i }));
	expect(onPlay).toHaveBeenCalledWith(song);
});

// BAD - Tests implementation
it("calls playSong function", () => {
	const playSong = vi.fn();
	// Testing internal implementation
});
```

### Use Descriptive Test Names

```typescript
// GOOD
it("disables play button while loading", () => {});
it("shows error message when API fails", () => {});
it("updates queue when song is added", () => {});

// BAD
it("works", () => {});
it("test1", () => {});
```

### Test Edge Cases

```typescript
it("handles empty queue", () => {
	// Test empty state
});

it("handles very long song titles", () => {
	// Test text truncation
});

it("handles offline mode", () => {
	// Test offline behavior
});
```

### Avoid Testing Library Implementation

```typescript
// GOOD
import { screen, fireEvent } from "@testing-library/react";

// GOOD - using data-testid when needed
<div data-testid="song-item">...</div>

// BAD - too tied to implementation
expect(container.querySelector(".song-item > button").classList.contains("play")).toBe(true);
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```
