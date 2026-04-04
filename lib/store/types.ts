import type { DetailedSong, EntityVisit, LocalPlaylist } from "@/types/entity";

export type RepeatMode = "off" | "one" | "all";

export interface AppStoreState {
	currentSong: DetailedSong | null;
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	volume: number;
	playbackSpeed: number;
	isMuted: boolean;
	queue: DetailedSong[];
	queueIndex: number;
	isShuffleEnabled: boolean;
	repeatMode: RepeatMode;
	favoriteIds: Set<string>;
	searchHistory: string[];
	playbackHistory: DetailedSong[];
	visitHistory: EntityVisit[];
	maxHistorySize: number;
	playlists: LocalPlaylist[];
	isQueueOpen: boolean;
	downloadedSongIds: Set<string>;
	sleepTimerMinutes: number | null;
}

export interface PersistedAppStoreState {
	favoriteIds: string[];
	searchHistory: string[];
	playbackHistory: DetailedSong[];
	visitHistory: EntityVisit[];
	playlists: LocalPlaylist[];
	volume: number;
	playbackSpeed: number;
	downloadedSongIds: string[];
	sleepTimerMinutes: number | null;
}

export interface AppStoreActions {
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
	setIsMuted: (muted: boolean) => void;
	toggleMute: () => void;
	addSongToQueue: (song: DetailedSong) => void;
	addSongsToQueue: (songs: DetailedSong[]) => void;
	insertSongNext: (song: DetailedSong) => void;
	removeSongFromQueue: (index: number) => void;
	clearQueue: () => void;
	setQueueIndex: (index: number) => void;
	toggleShuffle: () => void;
	setRepeatMode: (mode: RepeatMode) => void;
	reorderQueue: (fromIndex: number, toIndex: number) => void;
	toggleFavorite: (songId: string) => void;
	isFavorite: (songId: string) => boolean;
	addFavorite: (songId: string) => void;
	removeFavorite: (songId: string) => void;
	addToSearchHistory: (query: string) => void;
	clearSearchHistory: () => void;
	addToPlaybackHistory: (song: DetailedSong) => void;
	clearPlaybackHistory: () => void;
	addToVisitHistory: (visit: EntityVisit) => void;
	clearVisitHistory: () => void;
	createPlaylist: (name: string) => string;
	updatePlaylist: (playlistId: string, name: string) => void;
	deletePlaylist: (playlistId: string) => void;
	addSongToPlaylist: (playlistId: string, song: DetailedSong) => void;
	removeSongFromPlaylist: (playlistId: string, songId: string) => void;
	reorderPlaylistSongs: (
		playlistId: string,
		fromIndex: number,
		toIndex: number,
	) => void;
	setIsQueueOpen: (open: boolean) => void;
	setSleepTimer: (minutes: number | null) => void;
	addDownloadedSong: (songId: string) => void;
	removeDownloadedSong: (songId: string) => void;
	syncDownloadedSongs: (songIds: string[]) => void;
	clearDownloadedSongs: () => void;
	isDownloaded: (songId: string) => boolean;
	resetStore: () => void;
}

export type AppStore = AppStoreState & AppStoreActions;
