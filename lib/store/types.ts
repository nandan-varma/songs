import type { DetailedSong, LocalPlaylist } from "@/types/entity";

/**
 * Application-wide state types
 * @module lib/store/types
 */

export type RepeatMode = "off" | "one" | "all";

export interface AppStoreState {
	// ============ PLAYER STATE ============
	currentSong: DetailedSong | null;
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	volume: number;
	playbackSpeed: number;

	// ============ QUEUE STATE ============
	queue: DetailedSong[];
	queueIndex: number;
	isShuffleEnabled: boolean;
	repeatMode: RepeatMode;

	// ============ FAVORITES STATE ============
	favoriteIds: Set<string>;

	// ============ HISTORY STATE ============
	searchHistory: string[];
	playbackHistory: DetailedSong[];
	maxHistorySize: number;

	// ============ PLAYLISTS STATE ============
	playlists: LocalPlaylist[];
	selectedPlaylistId: string | null;

	// ============ UI STATE ============
	isMobile: boolean;
	isDarkMode: boolean;
	isQueueOpen: boolean;
	isOfflineMode: boolean;

	// ============ OFFLINE STATE ============
	downloadedSongIds: Set<string>;
	sleepTimerMinutes: number | null;
}

export interface AppStoreActions {
	// Player actions
	playSong: (song: DetailedSong, replaceQueue?: boolean) => void;
	playQueue: (songs: DetailedSong[], startIndex?: number) => void;
	togglePlayPause: () => void;
	playNext: () => void;
	playPrevious: () => void;
	setSongTime: (time: number) => void;
	setSongDuration: (duration: number) => void;
	setVolume: (volume: number) => void;
	setPlaybackSpeed: (speed: number) => void;
	setCurrentSong: (song: DetailedSong | null) => void;
	setIsPlaying: (playing: boolean) => void;

	// Queue actions
	addSongToQueue: (song: DetailedSong) => void;
	addSongsToQueue: (songs: DetailedSong[]) => void;
	removeSongFromQueue: (index: number) => void;
	clearQueue: () => void;
	setQueueIndex: (index: number) => void;
	toggleShuffle: () => void;
	setRepeatMode: (mode: RepeatMode) => void;
	reorderQueue: (fromIndex: number, toIndex: number) => void;

	// Favorites actions
	toggleFavorite: (songId: string) => void;
	isFavorite: (songId: string) => boolean;
	addFavorite: (songId: string) => void;
	removeFavorite: (songId: string) => void;

	// History actions
	addToSearchHistory: (query: string) => void;
	clearSearchHistory: () => void;
	addToPlaybackHistory: (song: DetailedSong) => void;
	clearPlaybackHistory: () => void;

	// Playlist actions
	createPlaylist: (name: string, description?: string) => void;
	updatePlaylist: (
		playlistId: string,
		name: string,
		description?: string,
	) => void;
	deletePlaylist: (playlistId: string) => void;
	addSongToPlaylist: (playlistId: string, song: DetailedSong) => void;
	removeSongFromPlaylist: (playlistId: string, songId: string) => void;
	setSelectedPlaylist: (playlistId: string | null) => void;

	// UI actions
	setIsMobile: (mobile: boolean) => void;
	setIsDarkMode: (dark: boolean) => void;
	setIsQueueOpen: (open: boolean) => void;
	setIsOfflineMode: (offline: boolean) => void;
	setSleepTimer: (minutes: number | null) => void;

	// Offline actions
	addDownloadedSong: (songId: string) => void;
	removeDownloadedSong: (songId: string) => void;
	isDownloaded: (songId: string) => boolean;

	// Reset
	resetStore: () => void;
}

export type AppStore = AppStoreState & AppStoreActions;
