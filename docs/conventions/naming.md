# Naming Conventions

## File Naming

### Components

Use kebab-case for component files:

```
song-item.tsx
audio-player.tsx
progress-bar.tsx
queue-sheet.tsx
playback-controls.tsx
```

### Hooks

Use `use-*` prefix with kebab-case:

```
use-audio-playback.ts
use-media-session.ts
use-offline-skip.ts
use-search-history.ts
```

### Contexts

Use kebab-case with optional `context` suffix:

```
player-context.tsx
queue-context.tsx
favorites-context.tsx
local-playlists-context.tsx
```

### Utilities

Use camelCase for utility files:

```
time.ts
audio-error.ts
toast.ts
logger.ts
```

### Types

Use PascalCase for type files:

```
PlayerState.ts
SongTypes.ts
ApiResponse.ts
```

### Constants

Use PascalCase or UPPER_SNAKE_CASE:

```
audio.ts          # Audio-related constants
constants.ts      # General constants
metadata.ts       # Metadata constants
```

## Identifier Naming

### Components

PascalCase for component names:

```typescript
export const SongItem = memo(function SongItem() {});
export const AudioPlayer = () => {};
export const ProgressBar = memo(function ProgressBar() {});
```

### Hooks

camelCase with `use` prefix:

```typescript
export function usePlayer() {}
export function useAudioSource() {}
export function useLocalStorage() {}
```

### Context Access Hooks

camelCase without `use` prefix on context name:

```typescript
// GOOD
export function usePlayer() {}
export function useQueue() {}

// AVOID
export function usePlayerContext() {}
export function useQueueContext() {}
```

### Functions and Variables

camelCase for functions and variables:

```typescript
// GOOD
const currentSong = null;
const isPlaying = false;
function getSongById(id: string) {}

const handlePlayClick = () => {};
const onSongSelect = (song: Song) => {};
```

### Constants

UPPER_SNAKE_CASE for constants:

```typescript
const MAX_QUEUE_SIZE = 100;
const DEFAULT_VOLUME = 0.7;
const API_BASE_URL = "https://api.example.com";
```

### Enums and Type Aliases

PascalCase for enums and types:

```typescript
enum AudioQuality {
	LOW = "48kbps",
	MEDIUM = "96kbps",
	HIGH = "160kbps",
	VERY_HIGH = "320kbps",
}

type PlayerState = {
	currentSong: DetailedSong | null;
	isPlaying: boolean;
};
```

### Interfaces

PascalCase with descriptive names:

```typescript
interface Song {
	id: string;
	name: string;
}

interface SongItemProps {
	song: Song;
	onPlay: (song: Song) => void;
}

interface PlaybackContextValue {
	currentSong: DetailedSong | null;
	isPlaying: boolean;
}
```

## Event Handler Naming

### Component Props

```typescript
interface ComponentProps {
	// Callback props
	onClick: () => void;
	onChange: (value: string) => void;
	onSelect: (item: Item) => void;
	onPlay: (song: Song) => void;
	onPause: () => void;

	// State props
	isLoading: boolean;
	isActive: boolean;
	isExpanded: boolean;
}
```

### Handler Functions

```typescript
// Event handlers
const handleClick = () => {};
const handleChange = (value: string) => {};
const handleSelect = (item: Item) => {};

// Async handlers
const handleSubmit = async (data: FormData) => {};
const handleDelete = async (id: string) => {};
```

### Custom Event Names

```typescript
// GOOD
const onItemClick = createEvent<(item: Item) => void>();
const onSongPlay = createEvent<(song: Song) => void>();

// BAD
const itemClick = createEvent<(item: Item) => void>();
const playSong = createEvent<(song: Song) => void>();
```

## Context Naming

### Context Names

```typescript
// GOOD
const PlayerContext = createContext<PlayerState | undefined>(undefined);
const QueueContext = createContext<QueueState | undefined>(undefined);
const FavoritesContext = createContext<FavoritesState | undefined>(undefined);

// AVOID
const PlayerStateContext = createContext<PlayerState | undefined>(undefined);
const PlayerContextProviderContext = createContext<PlayerState | undefined>(undefined);
```

### Provider Names

```typescript
// GOOD
export function PlayerProvider({ children }: { children: ReactNode }) {}
export function FavoritesProvider({ children }: { children: ReactNode }) {}

// AVOID
export function PlayerContextProvider({ children }: { children: ReactNode }) {}
export function usePlayerContextProvider() {}
```

### Hook Names

```typescript
// GOOD
export function usePlayer() {}
export function useFavorites() {}
export function useQueue() {}

// AVOID
export function usePlayerContext() {}
export function useFavoritesContext() {}
export function useQueueContext() {}
```

## State Naming

### State Variables

```typescript
// Boolean state - use is/has prefix
const [isPlaying, setIsPlaying] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [isExpanded, setIsExpanded] = useState(false);
const [hasError, setHasError] = useState(false);

// Array state
const [songs, setSongs] = useState<DetailedSong[]>([]);
const [items, setItems] = useState<Item[]>([]);

// Object state
const [formData, setFormData] = useState<FormData>(initial);

// Ref
const audioRef = useRef<HTMLAudioElement>(null);
const inputRef = useRef<HTMLInputElement>(null);
```

### Reducer State

```typescript
interface State {
	currentSong: DetailedSong | null;
	isPlaying: boolean;
	queue: DetailedSong[];
}

type Action =
	| { type: "PLAY_SONG"; payload: DetailedSong }
	| { type: "TOGGLE_PLAY" }
	| { type: "SET_QUEUE"; payload: DetailedSong[] };
```

## Directory Naming

### Feature Directories

```
components/
├── song/           # Song-related components
├── album/          # Album-related components
├── artist/         # Artist-related components
├── playlist/       # Playlist-related components
├── player/         # Player-related components
└── common/         # Shared components
```

### Hook Directories

```
hooks/
├── audio/          # Audio-related hooks
├── data/           # Data fetching hooks
├── player/         # Player hooks
├── pages/          # Page-specific hooks
├── ui/             # UI hooks
└── storage/        # Storage hooks
```

## Import Aliases

Use `@` alias for absolute imports:

```typescript
// GOOD
import { SongItem } from "@/components/song/song-item";
import { usePlayer } from "@/contexts/player-context";
import type { DetailedSong } from "@/types/entity";
import { formatTime } from "@/lib/utils/time";

// BAD
import { SongItem } from "../../components/song/song-item";
import { usePlayer } from "../../../contexts/player-context";
```

## Summary Table

| Type | Convention | Example |
|------|------------|---------|
| Component file | kebab-case | `song-item.tsx` |
| Component name | PascalCase | `SongItem` |
| Hook file | `use-*` kebab-case | `use-audio-playback.ts` |
| Hook name | camelCase `use*` | `useAudioPlayback` |
| Context file | kebab-case | `player-context.tsx` |
| Context name | PascalCase | `PlayerContext` |
| Provider function | PascalCase | `PlayerProvider` |
| Hook accessor | camelCase `use*` | `usePlayer` |
| Utility file | camelCase | `time.ts` |
| Type file | PascalCase | `PlayerState.ts` |
| Interface | PascalCase | `PlayerState` |
| Constants | UPPER_SNAKE_CASE | `MAX_SIZE` |
| Variables | camelCase | `currentSong` |
| Functions | camelCase | `handlePlay` |
| Boolean vars | is/has prefix | `isPlaying` |
| Event props | on* | `onPlay` |
| State setters | set* | `setIsPlaying` |
