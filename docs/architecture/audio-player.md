# Audio Player Architecture

The audio player is built with a modular architecture separating concerns across hooks, contexts, and components.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        AudioPlayer                               │
│  (Main component that composes all hooks)                        │
└─────────────────────────────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  useOffline   │    │  useAudioSource │    │ useAudioPlayback│
│     Skip      │    │                 │    │                 │
│               │    │ - Loads audio   │    │ - Syncs play/   │
│ - Checks song │    │   from blob or  │    │   pause state   │
│   caching     │    │   URL           │    │ - Handles iOS   │
│ - Auto-skip   │    │ - Manages blob  │    │   canplay events│
│   uncached    │    │   URL lifecycle │    │                 │
└───────────────┘    └─────────────────┘    └─────────────────┘
                               │                      │
                               │                      │
                               ▼                      ▼
                ┌─────────────────────────────────────────┐
                │        useAudioEventListeners            │
                │                                         │
                │ - Sets up HTML5 audio event listeners   │
                │ - Dispatches events to context setters  │
                │ - Updates time, duration, play state    │
                │ - Handles errors with proper logging    │
                └─────────────────────────────────────────┘
                               │
                               ▼
                ┌─────────────────────────────────────────┐
                │           useMediaSession                │
                │                                         │
                │ - System media controls integration     │
                │ - Metadata for lock screen/control center│
                │ - Position state for scrubbing          │
                └─────────────────────────────────────────┘
```

## Context Structure

### PlaybackContext (High-frequency updates)

State that changes frequently and causes re-renders:

```typescript
interface PlaybackState {
	currentSong: DetailedSong | null;
	isPlaying: boolean;
	volume: number;
	currentTime: number;
	duration: number;
	audioRef: React.RefObject<HTMLAudioElement>;
}
```

### QueueContext (Medium-frequency updates)

Queue-related state:

```typescript
interface QueueState {
	queue: DetailedSong[];
	currentIndex: number;
	isShuffleEnabled: boolean;
}
```

### PlayerActionsContext (Stable references)

Action callbacks that never change:

```typescript
interface PlayerActions {
	playSong: (song: DetailedSong, replaceQueue?: boolean) => void;
	playQueue: (songs: DetailedSong[], startIndex?: number) => void;
	addToQueue: (song: DetailedSong) => void;
	togglePlayPause: () => void;
	playNext: () => void;
	playPrevious: () => void;
	seekTo: (time: number) => void;
	setVolume: (volume: number) => void;
	reorderQueue: (fromIndex: number, toIndex: number) => void;
	clearQueue: () => void;
	toggleShuffle: () => void;
}
```

## Hook Responsibilities

### useAudioSource

**Single responsibility**: Manage audio source loading

```typescript
function useAudioSource(
	song: DetailedSong | null,
	isOfflineMode: boolean
): string | null {
	const [source, setSource] = useState<string | null>(null);
	const [blobUrl, setBlobUrl] = useState<string | null>(null);

	useEffect(() => {
		// Revoke previous blob URL
		if (blobUrl) {
			URL.revokeObjectURL(blobUrl);
			setBlobUrl(null);
		}

		if (!song) {
			setSource(null);
			return;
		}

		if (isOfflineMode) {
			// Load from cache
			const cachedBlob = getCachedBlob(song.id);
			if (cachedBlob) {
				const url = URL.createObjectURL(cachedBlob);
				setBlobUrl(url);
				setSource(url);
			} else {
				setSource(null);
			}
		} else {
			// Stream from URL (prefer 320kbps)
			const bestQuality = song.downloadUrl?.find(
				(u) => u.quality === "320kbps"
			);
			setSource(bestQuality?.url ?? null);
		}
	}, [song, isOfflineMode]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (blobUrl) {
				URL.revokeObjectURL(blobUrl);
			}
		};
	}, [blobUrl]);

	return source ?? blobUrl;
}
```

### useAudioPlayback

**Single responsibility**: Sync play/pause state with audio element

```typescript
function useAudioPlayback(
	audioRef: React.RefObject<HTMLAudioElement>,
	isPlaying: boolean,
	source: string | null
) {
	const [canPlay, setCanPlay] = useState(false);

	useEffect(() => {
		if (!audioRef.current || !source) return;

		if (isPlaying && !audioRef.current.paused) return;

		if (isPlaying && canPlay) {
			const playPromise = audioRef.current.play();
			if (playPromise !== undefined) {
				playPromise.catch((error) => {
					logAudioError(error, "AudioPlayback");
				});
			}
		} else if (!isPlaying && !audioRef.current.paused) {
			audioRef.current.pause();
		}
	}, [isPlaying, source, canPlay]);

	const handleCanPlay = useCallback(() => {
		setCanPlay(true);
	}, []);

	return { handleCanPlay };
}
```

### useAudioEventListeners

**Single responsibility**: Attach and manage audio event listeners

```typescript
interface AudioEventHandlers {
	onTimeUpdate?: (time: number) => void;
	onDurationChange?: (duration: number) => void;
	onEnded?: () => void;
	onPlay?: () => void;
	onPause?: () => void;
	onError?: (error: MediaError) => void;
}

function useAudioEventListeners(
	audioRef: React.RefObject<HTMLAudioElement>,
	handlers: AudioEventHandlers
) {
	useEffect(() => {
		if (!audioRef.current) return;

		const audio = audioRef.current;

		const handleTimeUpdate = () => {
			handlers.onTimeUpdate?.(audio.currentTime);
		};

		const handleDurationChange = () => {
			handlers.onDurationChange?.(audio.duration);
		};

		const handleEnded = () => {
			handlers.onEnded?.();
		};

		const handlePlay = () => {
			handlers.onPlay?.();
		};

		const handlePause = () => {
			handlers.onPause?.();
		};

		const handleError = () => {
			if (audio.error) {
				handlers.onError?.(audio.error);
			}
		};

		audio.addEventListener("timeupdate", handleTimeUpdate);
		audio.addEventListener("durationchange", handleDurationChange);
		audio.addEventListener("ended", handleEnded);
		audio.addEventListener("play", handlePlay);
		audio.addEventListener("pause", handlePause);
		audio.addEventListener("error", handleError);

		return () => {
			audio.removeEventListener("timeupdate", handleTimeUpdate);
			audio.removeEventListener("durationchange", handleDurationChange);
			audio.removeEventListener("ended", handleEnded);
			audio.removeEventListener("play", handlePlay);
			audio.removeEventListener("pause", handlePause);
			audio.removeEventListener("error", handleError);
		};
	}, [audioRef, handlers]);
}
```

### useMediaSession

**Single responsibility**: Media Session API integration

```typescript
function useMediaSession(
	currentSong: DetailedSong | null,
	isPlaying: boolean,
	currentTime: number,
	duration: number
) {
	useEffect(() => {
		if (!currentSong || !("mediaSession" in navigator)) return;

		const navigator = window.navigator as Window & {
			mediaSession: MediaSession;
		};

		// Set metadata
		navigator.mediaSession.metadata = new MediaMetadata({
			title: currentSong.name,
			artist: currentSong.artists.primary.map((a) => a.name).join(", "),
			album: currentSong.album.name,
			artwork: currentSong.image.map((img) => ({
				src: img.url,
				sizes: img.quality,
				type: "image/jpeg",
			})),
		});

		// Set action handlers
		navigator.mediaSession.setActionHandler("play", () => {
			togglePlayPause();
		});

		navigator.mediaSession.setActionHandler("pause", () => {
			togglePlayPause();
		});

		navigator.mediaSession.setActionHandler("previoustrack", () => {
			playPrevious();
		});

		navigator.mediaSession.setActionHandler("nexttrack", () => {
			playNext();
		});

		navigator.mediaSession.setActionHandler("seekbackward", () => {
			seekTo(Math.max(0, currentTime - SEEK_OFFSET_SECONDS));
		});

		navigator.mediaSession.setActionHandler("seekforward", () => {
			seekTo(Math.min(duration, currentTime + SEEK_OFFSET_SECONDS));
		});

		// Update position state
		if (duration > 0) {
			navigator.mediaSession.setPositionState({
				duration,
				position: currentTime,
				playbackRate: isPlaying ? 1 : 0,
			});
		}
	}, [currentSong, isPlaying, currentTime, duration]);
}
```

### useOfflineSkip

**Single responsibility**: Auto-skip uncached songs

```typescript
function useOfflineSkip(
	currentSong: DetailedSong | null,
	isOfflineMode: boolean,
	playNext: () => void
) {
	useEffect(() => {
		if (!currentSong || !isOfflineMode) return;

		const isCached = checkSongCache(currentSong.id);

		if (!isCached) {
			toast.error(`${currentSong.name} is not available offline`);
			playNext();
		}
	}, [currentSong, isOfflineMode, playNext]);
}
```

## Constants

```typescript
// lib/constants/audio.ts
export const PREFERRED_AUDIO_QUALITY = "320kbps";
export const SEEK_OFFSET_SECONDS = 10;
export const DEFAULT_VOLUME = 0.7;
export const RESTART_THRESHOLD_SECONDS = 3;
export const AUDIO_CHECK_INTERVAL_MS = 100;

export const PLAYBACK_SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export const SLEEP_TIMER_OPTIONS = [5, 10, 15, 30, 45, 60] as const; // minutes
```

## Error Handling

All audio errors are logged using `logAudioError`:

```typescript
// lib/utils/audio-error.ts
export function logAudioError(error: Error | MediaError, source: string) {
	const errorCode = "code" in error ? error.code : 0;
	const errorMessage = getErrorMessage(errorCode);

	if (process.env.NODE_ENV === "development") {
		console.error(`[Audio Error - ${source}]`, {
			code: errorCode,
			message: errorMessage,
			stack: error.stack,
		});
	} else {
		// In production, only log non-critical errors
		if (errorCode !== MediaError.MEDIA_ERR_ABORTED) {
			console.error(`[Audio Error - ${source}]`, {
				code: errorCode,
				message: errorMessage,
			});
		}
	}
}

function getErrorMessage(code: number): string {
	const messages: Record<number, string> = {
		[MediaError.MEDIA_ERR_ABORTED]: "Playback was aborted",
		[MediaError.MEDIA_ERR_NETWORK]: "Network error occurred",
		[MediaError.MEDIA_ERR_DECODE]: "Audio decode error",
		[MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]: "Audio format not supported",
	};
	return messages[code] ?? "Unknown audio error";
}
```

## Time Formatting

```typescript
// lib/utils/time.ts
export function formatTime(seconds: number): string {
	if (isNaN(seconds)) return "0:00";

	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function percentToVolume(percent: number): number {
	return Math.max(0, Math.min(1, percent / 100));
}

export function volumeToPercent(volume: number): number {
	return Math.round(volume * 100);
}

export function clampTime(time: number, duration: number): number {
	return Math.max(0, Math.min(time, duration));
}

export function calculateProgress(currentTime: number, duration: number): number {
	if (duration === 0) return 0;
	return (currentTime / duration) * 100;
}

export function progressToTime(progress: number, duration: number): number {
	return (progress / 100) * duration;
}
```

## File Structure

```
hooks/audio/
├── use-audio-playback.ts        # Play/pause state sync
├── use-audio-source.ts          # Source loading
├── use-audio-event-listeners.ts # Event listeners
└── use-media-session.ts         # System media controls

hooks/player/
├── use-offline-player.ts        # Offline-aware actions
└── use-offline-skip.ts          # Auto-skip uncached

hooks/playback/
├── use-playback-speed.ts        # Playback speed control
└── use-sleep-timer.ts           # Sleep timer

contexts/
├── player-context.tsx           # All player state & actions
└── queue-context.tsx            # Queue state management

components/player/
├── audio-player.tsx             # Main player component
├── player-container.tsx         # Card wrapper
├── mobile-layout.tsx            # Mobile UI
├── desktop-layout.tsx           # Desktop UI
├── playback-controls.tsx        # Play/pause/skip buttons
├── progress-bar.tsx             # Seek slider
├── volume-control.tsx           # Volume slider
├── queue-button.tsx             # Queue sheet trigger
├── queue-sheet.tsx              # Queue list
├── playback-menu.tsx            # Playback options menu
└── song-info.tsx                # Song title/artist

lib/
├── time.ts                      # Time formatting utilities
├── audio-error.ts               # Error handling utilities
└── constants/
    ├── audio.ts                 # Audio-related constants
    └── index.ts                 # Re-exports

types/
└── player.ts                    # Player type definitions
```

## Testing Considerations

1. **Mock AudioElement**: Use `createMockAudioElement()` from test utilities
2. **Test iOS behavior**: Ensure canplay event handling works
3. **Test error paths**: Verify error handling and logging
4. **Test offline mode**: Verify auto-skip behavior
5. **Test cleanup**: Verify blob URLs are revoked on unmount

## Common Issues

### iOS Playback Not Starting

- Ensure `canplay` event is handled before calling `play()`
- iOS requires user gesture for audio playback
- Check that audio element is properly mounted

### Audio Element Unmounting

- Never return `null` from AudioPlayer when `currentSong` is null
- Keep audio element mounted at all times
- Pass `null` for `currentSong` instead of unmounting

### Memory Leaks

- Always clean up blob URLs with `URL.revokeObjectURL()`
- Remove event listeners on unmount
- Clear intervals/timeouts in cleanup functions
