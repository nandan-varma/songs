import type { DetailedSong } from "@/lib/types";

export { AudioQuality } from "@/lib/types";

export const PREFERRED_AUDIO_QUALITY = "320kbps" as const;
export const SEEK_OFFSET_SECONDS = 10 as const;
export const DEFAULT_VOLUME = 0.7;
export const RESTART_THRESHOLD_SECONDS = 3;
export const AUDIO_CHECK_INTERVAL_MS = 100;

export interface PlayerState {
	currentSong: DetailedSong | null;
	isPlaying: boolean;
	volume: number;
	currentTime: number;
	duration: number;
	audioRef: React.RefObject<HTMLAudioElement | null>;
}

export interface QueueState {
	queue: DetailedSong[];
	currentIndex: number;
}

export interface PlayerActions {
	playSong: (song: DetailedSong, replaceQueue?: boolean) => void;
	playQueue: (songs: DetailedSong[], startIndex?: number) => void;
	addToQueue: (song: DetailedSong) => void;
	addMultipleToQueue: (songs: DetailedSong[]) => void;
	removeFromQueue: (index: number) => void;
	reorderQueue: (fromIndex: number, toIndex: number) => void;
	clearQueue: () => void;
	togglePlayPause: () => void;
	playNext: () => void;
	playPrevious: () => void;
	seekTo: (time: number) => void;
	setVolume: (volume: number) => void;
}

export interface AudioEventCallbacks {
	onTimeUpdate: (currentTime: number) => void;
	onDurationChange: (duration: number) => void;
	onEnded: () => void;
	onPlay: () => void;
	onPause: () => void;
	onError: (error: MediaError | null) => void;
}

export interface UseAudioSourceProps {
	currentSong: DetailedSong | null;
	audioRef: React.RefObject<HTMLAudioElement | null>;
	isOfflineMode: boolean;
	getSongBlob: (songId: string) => Blob | null;
}

export interface UseAudioPlaybackProps {
	currentSong: DetailedSong | null;
	audioRef: React.RefObject<HTMLAudioElement | null>;
	isPlaying: boolean;
}

export interface UseMediaSessionProps {
	currentSong: DetailedSong | null;
	audioRef: React.RefObject<HTMLAudioElement | null>;
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	playNext: () => void;
	playPrevious: () => void;
	seekTo: (time: number) => void;
}

export interface UseOfflineSkipProps {
	currentSong: DetailedSong | null;
	isOfflineMode: boolean;
	isSongCached: (songId: string) => boolean;
	playNext: () => void;
}

export interface UseOfflinePlayerActions {
	playSong: (song: DetailedSong, replaceQueue?: boolean) => void;
	playQueue: (songs: DetailedSong[], startIndex?: number) => void;
	addToQueue: (song: DetailedSong) => void;
	addMultipleToQueue: (songs: DetailedSong[]) => void;
}

export interface SongItemProps {
	song: DetailedSong;
	isPlaying: boolean;
	onPlay: () => void;
	onAddToQueue: () => void;
	onSeekTo?: (time: number) => void;
}

export interface PlaybackControlsProps {
	isPlaying: boolean;
	queueLength: number;
	onTogglePlayPause: () => void;
	onPlayPrevious: () => void;
	onPlayNext: () => void;
}

export interface ProgressBarProps {
	currentTime: number;
	duration: number;
	onSeekTo: (time: number) => void;
}

export interface VolumeControlProps {
	volume: number;
	onSetVolume: (volume: number) => void;
}

export interface QueueButtonProps {
	queue: DetailedSong[];
	currentIndex: number;
	onRemoveFromQueue: (index: number) => void;
	onReorderQueue: (fromIndex: number, toIndex: number) => void;
}

export interface SongInfoProps {
	currentSong: DetailedSong | null;
}

export interface MobileLayoutProps {
	currentSong: DetailedSong | null;
	isPlaying: boolean;
	volume: number;
	currentTime: number;
	duration: number;
	queue: DetailedSong[];
	currentIndex: number;
	onTogglePlayPause: () => void;
	onPlayPrevious: () => void;
	onPlayNext: () => void;
	onSeekTo: (time: number) => void;
	onSetVolume: (volume: number) => void;
	onRemoveFromQueue: (index: number) => void;
	onReorderQueue: (fromIndex: number, toIndex: number) => void;
}

export interface DesktopLayoutProps {
	currentSong: DetailedSong | null;
	isPlaying: boolean;
	volume: number;
	currentTime: number;
	duration: number;
	queue: DetailedSong[];
	currentIndex: number;
	onTogglePlayPause: () => void;
	onPlayPrevious: () => void;
	onPlayNext: () => void;
	onSeekTo: (time: number) => void;
	onSetVolume: (volume: number) => void;
	onRemoveFromQueue: (index: number) => void;
	onReorderQueue: (fromIndex: number, toIndex: number) => void;
}

export interface PlayerContainerProps {
	isOfflineMode: boolean;
	audioElement: React.ReactNode;
	children: React.ReactNode;
}
