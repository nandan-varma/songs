# Audio Player Architecture

## Overview

The audio player is built with a modular architecture that separates concerns across hooks, contexts, and components.

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
- `currentSong` - Currently playing song
- `isPlaying` - Playback state
- `volume` - Volume level (0-1)
- `currentTime` - Current playback position
- `duration` - Total song duration
- `audioRef` - Reference to audio element

### QueueContext (Medium-frequency updates)
Queue-related state:
- `queue` - Array of songs in queue
- `currentIndex` - Current song index in queue

### PlayerActionsContext (Stable references)
Action callbacks that never change:
- `playSong`, `playQueue`, `addToQueue`, etc.
- `togglePlayPause`, `playNext`, `playPrevious`
- `seekTo`, `setVolume`, `reorderQueue`

## Hook Responsibilities

### useAudioSource
**Single responsibility**: Manage audio source loading

- Loads audio from cached blob or remote URL
- Handles offline mode (only uses cached audio)
- Manages blob URL cleanup
- Uses `PREFERRED_AUDIO_QUALITY` constant (320kbps)

### useAudioPlayback
**Single responsibility**: Sync play/pause state with audio element

- Handles iOS autoplay restrictions
- Waits for `canplay` event before calling `play()`
- Syncs `isPlaying` state with actual audio state
- Uses error logging for debugging

### useAudioEventListeners
**Single responsibility**: Attach and manage audio event listeners

- Sets up listeners for: timeupdate, durationchange, ended, play, pause, error
- Polls for audio element existence if not ready
- Properly cleans up listeners on unmount
- Dispatches events to context setters

### useMediaSession
**Single responsibility**: Media Session API integration

- Sets system metadata (title, artist, artwork)
- Handles system control actions (play, pause, seek, skip)
- Updates position state for scrubbing
- Uses `SEEK_OFFSET_SECONDS` constant (10 seconds)

### useOfflineSkip
**Single responsibility**: Auto-skip uncached songs

- Checks if current song is cached in offline mode
- Shows toast and skips to next song if not cached

### useOfflinePlayerActions
**Single responsibility**: Offline-aware wrapper for player actions

- Filters songs based on offline availability
- Shows appropriate toast messages
- Provides both filtered and unfiltered action versions

## Constants

```typescript
PREFERRED_AUDIO_QUALITY = "320kbps"  // Preferred audio quality
SEEK_OFFSET_SECONDS = 10             // Skip forward/backward amount
DEFAULT_VOLUME = 0.7                 // Initial volume level
RESTART_THRESHOLD_SECONDS = 3        // Restart song if < 3 seconds in
AUDIO_CHECK_INTERVAL_MS = 100        // Polling interval for audio element
```

## Error Handling

All audio errors are logged using the `logAudioError` utility:
- In development: Full error details logged
- In production: Only error code and message logged

Error types:
- `MEDIA_ERR_ABORTED` (1): Playback was aborted
- `MEDIA_ERR_NETWORK` (2): Network error
- `MEDIA_ERR_DECODE` (3): Audio decode error
- `MEDIA_ERR_SRC_NOT_SUPPORTED` (4): Format not supported

## Time Formatting

Use the `lib/time.ts` utilities for time formatting:
- `formatTime(seconds)` - MM:SS format
- `percentToVolume(percent)` - Convert % to volume (0-1)
- `volumeToPercent(volume)` - Convert volume to %
- `clampTime(time, duration)` - Clamp time to valid range
- `calculateProgress(currentTime, duration)` - Calculate progress %
- `progressToTime(progress, duration)` - Convert progress to time

## File Structure

```
hooks/
├── use-audio-playback.ts       # Play/pause state sync
├── use-audio-source.ts         # Source loading
├── use-audio-event-listeners.ts # Event listeners
├── use-media-session.ts        # System media controls
├── use-offline-skip.ts         # Auto-skip uncached
└── use-offline-player.ts       # Offline-aware actions

contexts/
├── player-context.tsx          # All player state & actions
└── queue-context.tsx           # Queue state management

components/player/
├── audio-player.tsx            # Main player component
├── player-container.tsx        # Card wrapper
├── mobile-layout.tsx           # Mobile UI
├── desktop-layout.tsx          # Desktop UI
├── playback-controls.tsx       # Play/pause/skip buttons
├── progress-bar.tsx            # Seek slider
├── volume-control.tsx          # Volume slider
├── queue-button.tsx            # Queue sheet trigger
├── queue-sheet.tsx             # Queue list
└── song-info.tsx               # Song title/artist

lib/
├── time.ts                     # Time formatting utilities
└── audio-error.ts              # Error handling utilities

types/
└── player.ts                   # Player type definitions
```

## Testing Considerations

When testing audio player functionality:

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
