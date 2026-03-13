# Keyboard Shortcuts

The Songs PWA supports global keyboard shortcuts for playback control.

## Default Shortcuts

### Playback Control

| Key | Action | Description |
|-----|--------|-------------|
| Space | Toggle Play/Pause | Play or pause the current track |
| N | Next Track | Skip to the next song in queue |
| P | Previous Track | Go back to previous song |
| S | Toggle Shuffle | Enable or disable shuffle mode |
| Q | Toggle Queue | Show or hide the queue panel |

### Seeking

| Key | Action | Description |
|-----|--------|-------------|
| Left Arrow | Seek Backward | Jump back 10 seconds |
| Right Arrow | Seek Forward | Jump forward 10 seconds |

### Volume Control

| Key | Action | Description |
|-----|--------|-------------|
| Up Arrow | Volume Up | Increase volume by 5% |
| Down Arrow | Volume Down | Decrease volume by 5% |
| M | Toggle Mute | Mute or unmute audio |

### Playback Speed

| Key | Action | Description |
|-----|--------|-------------|
| 1 | 1x Speed | Set playback to normal speed |
| 2 | 1.25x Speed | Set playback to 1.25x |
| 3 | 1.5x Speed | Set playback to 1.5x |
| 4 | 2x Speed | Set playback to 2x speed |

### Other

| Key | Action | Description |
|-----|--------|-------------|
| Escape | Close Modal/Drawer | Close any open modal or drawer |
| / or Cmd+K | Open Search | Focus the search bar |
| ? | Show Shortcuts | Display keyboard shortcuts help |

## Global Shortcuts

These shortcuts work anywhere in the app, even when focus is not on the player:

- Space (play/pause)
- N (next)
- P (previous)
- M (mute)
- Up/Down (volume)
- Left/Right (seek)
- Q (queue)
- S (shuffle)

## Context-Specific Shortcuts

### Search Page

| Key | Action |
|-----|--------|
| / | Focus search input |
| Enter | Perform search |
| Escape | Clear search |
| Arrow keys | Navigate search results |

### Queue Panel

| Key | Action |
|-----|--------|
| J | Focus next queue item |
| K | Focus previous queue item |
| Enter | Play focused queue item |
| Delete | Remove focused item |

### Playlist Edit

| Key | Action |
|-----|--------|
| Cmd+S | Save playlist |
| Escape | Cancel editing |

## Implementation

### useKeyboardShortcuts Hook

```typescript
// hooks/ui/use-keyboard-shortcuts.ts
import { useEffect, useCallback } from "react";
import { usePlayerActions } from "@/contexts/player-context";
import { useQueueActions } from "@/contexts/queue-context";
import { usePlayback } from "@/contexts/player-context";

interface KeyboardShortcut {
	key: string;
	ctrl?: boolean;
	meta?: boolean;
	shift?: boolean;
	alt?: boolean;
	action: () => void;
}

export function useKeyboardShortcuts() {
	const { togglePlayPause, playNext, playPrevious, seekTo, setVolume } = usePlayerActions();
	const { toggleShuffle } = useQueueActions();
	const { isPlaying, volume, currentTime, duration } = usePlayback();

	const shortcuts: KeyboardShortcut[] = [
		{
			key: " ",
			action: () => togglePlayPause(),
		},
		{
			key: "n",
			action: () => playNext(),
		},
		{
			key: "p",
			action: () => playPrevious(),
		},
		{
			key: "m",
			action: () => {
				const newVolume = volume > 0 ? 0 : 0.7;
				setVolume(newVolume);
			},
		},
		{
			key: "ArrowLeft",
			action: () => seekTo(Math.max(0, currentTime - 10)),
		},
		{
			key: "ArrowRight",
			action: () => seekTo(Math.min(duration, currentTime + 10)),
		},
		{
			key: "ArrowUp",
			action: () => setVolume(Math.min(1, volume + 0.05)),
		},
		{
			key: "ArrowDown",
			action: () => setVolume(Math.max(0, volume - 0.05)),
		},
		{
			key: "s",
			action: () => toggleShuffle(),
		},
		{
			key: "q",
			// Toggle queue - requires context
		},
	];

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			for (const shortcut of shortcuts) {
				const keyMatch = event.key === shortcut.key;
				const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
				const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;
				const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
				const altMatch = shortcut.alt ? event.altKey : !event.altKey;

				if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
					event.preventDefault();
					shortcut.action();
					break;
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [shortcuts]);
}
```

### Integration with App

```typescript
// app/layout.tsx
"use client";

import { useKeyboardShortcuts } from "@/hooks/ui/use-keyboard-shortcuts";

export function RootLayout({ children }: { children: React.ReactNode }) {
	useKeyboardShortcuts();

	return <>{children}</>;
}
```

## Disabling Shortcuts

Shortcuts can be disabled in specific contexts:

```typescript
// Disable shortcuts in input fields
<input
	onFocus={() => disableShortcuts(true)}
	onBlur={() => disableShortcuts(false)}
/>

// Disable shortcuts during modal/drawer
<Dialog open={isOpen} onOpenChange={handleOpenChange}>
	<DialogContent>
		{/* Dialog content */}
	</DialogContent>
</Dialog>
```

## Custom Shortcuts

### Adding New Shortcuts

```typescript
// In a feature hook
export function useFeatureShortcuts() {
	const { featureAction } = useFeatureActions();

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "f" && event.ctrlKey) {
				event.preventDefault();
				featureAction();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [featureAction]);
}
```

### Shortcut Conflicts

When adding new shortcuts, be aware of browser defaults:

| Key | Browser Default |
|-----|-----------------|
| Ctrl+S | Save page |
| Ctrl+N | New window |
| Ctrl+T | New tab |
| Ctrl+W | Close tab |
| Ctrl+R | Reload page |
| Ctrl+U | View source |
| F11 | Fullscreen |
| Space | Page down (when not focused) |

## Accessibility Considerations

1. **Announce actions**: Use ARIA live regions to announce playback changes
2. **Focus management**: Ensure keyboard focus is managed when opening/closing modals
3. **Visible focus**: Maintain visible focus indicators
4. **Alternative controls**: Ensure all keyboard shortcuts have mouse/touch equivalents

## Testing Shortcuts

```typescript
// tests/hooks/use-keyboard-shortcuts.test.ts
import { renderHook, act } from "@testing-library/react";
import { useKeyboardShortcuts } from "@/hooks/ui/use-keyboard-shortcuts";
import { vi } from "vitest";

describe("useKeyboardShortcuts", () => {
	it("toggles play on space press", () => {
		const togglePlayPause = vi.fn();

		renderHook(() => useKeyboardShortcuts());

		// Simulate space key press
		act(() => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
		});

		expect(togglePlayPause).toHaveBeenCalled();
	});

	it("seeks forward on right arrow", () => {
		const seekTo = vi.fn();

		renderHook(() => useKeyboardShortcuts());

		act(() => {
			window.dispatchEvent(
				new KeyboardEvent("keydown", { key: "ArrowRight" })
			);
		});

		expect(seekTo).toHaveBeenCalled();
	});
});
```

## Shortcut Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    Songs PWA Shortcuts                       │
├─────────────────────────────────────────────────────────────┤
│  Space        Play/Pause                                    │
│  N            Next track                                    │
│  P            Previous track                                │
│  M            Toggle mute                                   │
│  ←            Seek backward 10s                             │
│  →            Seek forward 10s                              │
│  ↑            Volume up                                     │
│  ↓            Volume down                                   │
│  S            Toggle shuffle                                │
│  Q            Toggle queue                                  │
│  1/2/3/4      Playback speed (1x, 1.25x, 1.5x, 2x)         │
│  / or Cmd+K   Open search                                   │
│  Escape       Close modal/drawer                            │
├─────────────────────────────────────────────────────────────┤
│  ?            Show this help                                │
└─────────────────────────────────────────────────────────────┘
```
