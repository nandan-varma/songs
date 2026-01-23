# Components Reference

## Common Components

### ErrorBoundary

```typescript
import { ErrorBoundary } from "@/components/common/error-boundary";

<ErrorBoundary fallback={<ErrorDisplay />}>
	<ComponentThatMayError />
</ErrorBoundary>
```

**Props:**
- `fallback`: React node to display when error occurs
- `onError`: Callback when error is caught

### FavoriteButton

```typescript
import { FavoriteButton } from "@/components/common/favorite-button";

<FavoriteButton
	isFavorite={boolean}
	onToggle={() => void}
/>
```

### ProgressiveImage

```typescript
import { ProgressiveImage } from "@/components/common/progressive-image";

<ProgressiveImage
	src={string}
	alt={string}
	placeholder={string}
	className={string}
/>
```

### SearchBar

```typescript
import { SearchBar } from "@/components/common/search-bar";

<SearchBar
	value={string}
	onChange={(value) => void}
	onSubmit={() => void}
	placeholder={string}
/>
```

### SongActionMenu

```typescript
import { SongActionMenu } from "@/components/common/song-action-menu";

<SongActionMenu
	song={DetailedSong}
	trigger={<button>...</button>}
/>
```

## Player Components

### AudioPlayer

```typescript
import { AudioPlayer } from "@/components/player/audio-player";

<AudioPlayer />
```

The main audio player component that manages playback state.

### DesktopLayout

```typescript
import { DesktopLayout } from "@/components/player/desktop-layout";

<DesktopLayout>
	{children}
</DesktopLayout>
```

Desktop-specific player layout.

### MobileLayout

```typescript
import { MobileLayout } from "@/components/player/mobile-layout";

<MobileLayout>
	{children}
</MobileLayout>
```

Mobile-specific player layout.

### PlaybackControls

```typescript
import { PlaybackControls } from "@/components/player/playback-controls";

<PlaybackControls />
```

Play, pause, skip buttons.

### ProgressBar

```typescript
import { ProgressBar } from "@/components/player/progress-bar";

<ProgressBar
	currentTime={number}
	duration={number}
	onSeek={(time) => void}
/>
```

Seek slider with time display.

### VolumeControl

```typescript
import { VolumeControl } from "@/components/player/volume-control";

<VolumeControl
	volume={number}
	onVolumeChange={(volume) => void}
/>
```

Volume slider with mute toggle.

### QueueButton

```typescript
import { QueueButton } from "@/components/player/queue-button";

<QueueButton />
```

Button to open queue sheet.

### QueueSheet

```typescript
import { QueueSheet } from "@/components/player/queue-sheet";

<QueueSheet
	open={boolean}
	onClose={() => void}
/>
```

Sheet displaying the current queue.

### PlaybackMenu

```typescript
import { PlaybackMenu } from "@/components/player/playback-menu";

<PlaybackMenu
	trigger={<button>...</button>}
/>
```

Menu with playback options (speed, sleep timer, etc.).

### SongInfo

```typescript
import { SongInfo } from "@/components/player/song-info";

<SongInfo
	song={DetailedSong | null}
/>
```

Displays current song title and artist.

## List Components

### SongsList

```typescript
import { SongsList } from "@/components/songs-list";

<SongsList
	songs={DetailedSong[]}
	onPlay={(song) => void}
	onAddToQueue={(song) => void}
/>
```

### AlbumsList

```typescript
import { AlbumsList } from "@/components/albums-list";

<AlbumsList
	albums={AlbumSearchResult[]}
	onAlbumClick={(album) => void}
/>
```

### ArtistsList

```typescript
import { ArtistsList } from "@/components/artists-list";

<ArtistsList
	artists={ArtistSearchResult[]}
	onArtistClick={(artist) => void}
/>
```

### PlaylistsList

```typescript
import { PlaylistsList } from "@/components/playlists-list";

<PlaylistsList
	playlists={PlaylistSearchResult[]}
	onPlaylistClick={(playlist) => void}
/>
```

## Feature Components

### DownloadButton

```typescript
import { DownloadButton } from "@/components/download-button";

<DownloadButton
	song={DetailedSong}
/>
```

Button to download a song for offline playback.

### HistoryList

```typescript
import { HistoryList } from "@/components/history-list";

<HistoryList
	history={DetailedSong[]}
	onPlay={(song) => void}
/>
```

Displays playback history.

### Navigation

```typescript
import { Navigation } from "@/components/navigation";

<Navigation />
```

Main navigation component.

### BreadcrumbNav

```typescript
import { BreadcrumbNav } from "@/components/breadcrumb-nav";

<BreadcrumbNav
	items={BreadcrumbItem[]}
/>
```

Breadcrumb navigation component.

## UI Components

The app uses Radix UI primitives wrapped with Tailwind CSS:

### Button

```typescript
import { Button } from "@/components/ui/button";

<Button variant="primary" size="default">
	Click me
</Button>
```

### Dialog

```typescript
import { Dialog } from "@/components/ui/dialog";

<Dialog open={boolean} onOpenChange={setOpen}>
	<DialogTrigger>Open</DialogTrigger>
	<DialogContent>
		<DialogTitle>Title</DialogTitle>
		{children}
	</DialogContent>
</Dialog>
```

### Sheet

```typescript
import { Sheet } from "@/components/ui/sheet";

<Sheet open={boolean} onOpenChange={setOpen}>
	<SheetTrigger>Open</SheetTrigger>
	<SheetContent>
		{children}
	</SheetContent>
</Sheet>
```

### Slider

```typescript
import { Slider } from "@/components/ui/slider";

<Slider
	value={[value]}
	onValueChange={([value]) => void}
	min={0}
	max={100}
/>
```

### Switch

```typescript
import { Switch } from "@/components/ui/switch";

<Switch
	checked={boolean}
	onCheckedChange={setChecked}
/>
```

### Tabs

```typescript
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

<Tabs defaultValue="tab1">
	<TabsList>
		<TabsTrigger value="tab1">Tab 1</TabsTrigger>
		<TabsTrigger value="tab2">Tab 2</TabsTrigger>
	</TabsList>
	<TabsContent value="tab1">Content 1</TabsContent>
	<TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

### Card

```typescript
import { Card, CardContent, CardHeader } from "@/components/ui/card";

<Card>
	<CardHeader>Title</CardHeader>
	<CardContent>Content</CardContent>
</Card>
```

### Input

```typescript
import { Input } from "@/components/ui/input";

<Input
	value={value}
	onChange={(e) => setValue(e.target.value)}
	placeholder="Enter text"
/>
```

### ScrollArea

```typescript
import { ScrollArea } from "@/components/ui/scroll-area";

<ScrollArea className="h-[200px]">
	{children}
</ScrollArea>
```

### Tooltip

```typescript
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

<Tooltip>
	<TooltipTrigger>Hover me</TooltipTrigger>
	<TooltipContent>Tooltip content</TooltipContent>
</Tooltip>
```
