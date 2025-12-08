import { render, screen, act } from "@testing-library/react";
import { AudioPlayer } from "../../components/audio-player";
import type { DetailedSong } from "../../lib/types";

// Mock contexts
jest.mock("../../contexts/player-context", () => ({
	usePlayback: jest.fn(),
	useQueue: jest.fn(),
	usePlayerActions: jest.fn(),
}));

jest.mock("../../contexts/downloads-context", () => ({
	useDownloadsActions: jest.fn(),
}));

jest.mock("../../contexts/offline-context", () => ({
	useOffline: jest.fn(),
}));

// Mock components
jest.mock("../../components/player/playback-controls", () => ({
	PlaybackControls: ({
		isPlaying,
		queueLength,
		onTogglePlayPause,
		onPlayPrevious,
		onPlayNext,
	}: any) => (
		<div data-testid="playback-controls">
			<button data-testid="play-pause" onClick={onTogglePlayPause}>
				{isPlaying ? "Pause" : "Play"}
			</button>
			<button data-testid="previous" onClick={onPlayPrevious}>
				Previous
			</button>
			<button data-testid="next" onClick={onPlayNext}>
				Next
			</button>
			<span data-testid="queue-length">{queueLength}</span>
		</div>
	),
}));

jest.mock("../../components/player/progress-bar", () => ({
	ProgressBar: ({ currentTime, duration, onSeekTo }: any) => (
		<div data-testid="progress-bar">
			<span data-testid="current-time">{currentTime}</span>
			<span data-testid="duration">{duration}</span>
			<button data-testid="seek" onClick={() => onSeekTo(30)}>
				Seek
			</button>
		</div>
	),
}));

jest.mock("../../components/player/queue-button", () => ({
	QueueButton: ({ queue, currentIndex, onRemoveFromQueue }: any) => (
		<div data-testid="queue-button">
			<span data-testid="queue-count">{queue.length}</span>
			<span data-testid="current-index">{currentIndex}</span>
			<button data-testid="remove-queue" onClick={() => onRemoveFromQueue(0)}>
				Remove
			</button>
		</div>
	),
}));

jest.mock("../../components/player/song-info", () => ({
	SongInfo: ({ currentSong }: any) => (
		<div data-testid="song-info">
			<span data-testid="song-name">{currentSong.name}</span>
		</div>
	),
}));

jest.mock("../../components/player/volume-control", () => ({
	VolumeControl: ({ volume, onSetVolume }: any) => (
		<div data-testid="volume-control">
			<span data-testid="volume">{volume}</span>
			<button data-testid="set-volume" onClick={() => onSetVolume(0.5)}>
				Set Volume
			</button>
		</div>
	),
}));

// Mock Next.js Image
jest.mock("next/image", () => ({
	__esModule: true,
	default: ({ src, alt }: any) => (
		<img src={src} alt={alt} data-testid="next-image" />
	),
}));

// Mock lucide-react
jest.mock("lucide-react", () => ({
	WifiOff: () => <div data-testid="wifi-off-icon" />,
}));

// Mock sonner
jest.mock("sonner", () => ({
	toast: {
		error: jest.fn(),
		warning: jest.fn(),
		success: jest.fn(),
	},
}));

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(window.URL, "createObjectURL", {
	writable: true,
	value: jest.fn(() => "blob:mock-url"),
});

Object.defineProperty(window.URL, "revokeObjectURL", {
	writable: true,
	value: jest.fn(),
});

// Mock Media Session API
Object.defineProperty(navigator, "mediaSession", {
	writable: true,
	value: {
		metadata: null,
		playbackState: "none",
		setActionHandler: jest.fn(),
		setPositionState: jest.fn(),
	},
});

// Mock MediaMetadata
global.MediaMetadata = jest.fn().mockImplementation((data) => data);

// Mock HTMLAudioElement methods
Object.defineProperty(HTMLAudioElement.prototype, "load", {
	writable: true,
	value: jest.fn(),
});

Object.defineProperty(HTMLAudioElement.prototype, "play", {
	writable: true,
	value: jest.fn().mockResolvedValue(undefined),
});

Object.defineProperty(HTMLAudioElement.prototype, "pause", {
	writable: true,
	value: jest.fn(),
});

const mockSong: DetailedSong = {
	id: "song1",
	name: "Test Song",
	type: "song",
	year: "2023",
	releaseDate: null,
	duration: 180,
	label: null,
	explicitContent: false,
	playCount: null,
	language: "english",
	hasLyrics: false,
	lyricsId: null,
	url: "song-url",
	copyright: null,
	album: {
		id: "album1",
		name: "Test Album",
		url: "album-url",
	},
	artists: {
		primary: [
			{
				id: "artist1",
				name: "Test Artist",
				role: "primary" as const,
				type: "artist" as const,
				image: [],
				url: "artist-url",
			},
		],
		featured: [],
		all: [
			{
				id: "artist1",
				name: "Test Artist",
				role: "primary" as const,
				type: "artist" as const,
				image: [],
				url: "artist-url",
			},
		],
	},
	image: [
		{ quality: "50x50", url: "small.jpg" },
		{ quality: "150x150", url: "medium.jpg" },
		{ quality: "500x500", url: "large.jpg" },
	],
	downloadUrl: [
		{ quality: "160kbps", url: "audio-160.mp3" },
		{ quality: "320kbps", url: "audio-320.mp3" },
	],
};

describe("AudioPlayer", () => {
	const mockUsePlayback = require("../../contexts/player-context").usePlayback;
	const mockUseQueue = require("../../contexts/player-context").useQueue;
	const mockUsePlayerActions =
		require("../../contexts/player-context").usePlayerActions;
	const mockUseDownloadsActions =
		require("../../contexts/downloads-context").useDownloadsActions;
	const mockUseOffline = require("../../contexts/offline-context").useOffline;
	const mockToast = require("sonner").toast;

	let mockAudioRef: { current: HTMLAudioElement | null };

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock audio element
		const mockAudio = {
			src: "",
			load: jest.fn(),
			play: jest.fn().mockResolvedValue(undefined),
			pause: jest.fn(),
			get paused() {
				return this._paused;
			},
			set paused(value) {
				this._paused = value;
			},
			_paused: false,
			currentTime: 0,
			duration: 0,
			playbackRate: 1,
			volume: 1,
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
		} as any;

		mockAudioRef = { current: mockAudio as any };

		// Setup default mocks
		mockUsePlayback.mockReturnValue({
			currentSong: mockSong,
			isPlaying: false,
			volume: 0.7,
			currentTime: 0,
			duration: 180,
			audioRef: mockAudioRef,
		});

		mockUseQueue.mockReturnValue({
			queue: [mockSong],
			currentIndex: 0,
		});

		mockUsePlayerActions.mockReturnValue({
			togglePlayPause: jest.fn(),
			playNext: jest.fn(),
			playPrevious: jest.fn(),
			seekTo: jest.fn(),
			setVolume: jest.fn(),
			removeFromQueue: jest.fn(),
		});

		mockUseDownloadsActions.mockReturnValue({
			getSongBlob: jest.fn(() => null),
			isSongCached: jest.fn(() => true),
		});

		mockUseOffline.mockReturnValue({
			isOfflineMode: false,
		});

		// Reset Media Session mocks
		(navigator.mediaSession.setActionHandler as jest.Mock).mockClear();
		(navigator.mediaSession.setPositionState as jest.Mock).mockClear();
	});

	it("renders nothing when there is no current song", () => {
		mockUsePlayback.mockReturnValue({
			currentSong: null,
			isPlaying: false,
			volume: 0.7,
			currentTime: 0,
			duration: 0,
			audioRef: { current: null },
		});

		const { container } = render(<AudioPlayer />);
		expect(container.firstChild).toBeNull();
	});

	it("renders player UI when current song exists", () => {
		render(<AudioPlayer />);

		expect(screen.getAllByTestId("playback-controls")).toHaveLength(2); // mobile and desktop
		expect(screen.getAllByTestId("progress-bar")).toHaveLength(2);
		expect(screen.getAllByTestId("queue-button")).toHaveLength(2);
		expect(screen.getAllByTestId("volume-control")).toHaveLength(2);
		expect(screen.getByTestId("song-name").textContent).toBe("Test Song");
	});

	it("shows offline mode badge when in offline mode", () => {
		mockUseOffline.mockReturnValue({
			isOfflineMode: true,
		});

		render(<AudioPlayer />);

		expect(screen.getByTestId("wifi-off-icon")).toBeTruthy();
		expect(screen.getByText("Offline Mode")).toBeTruthy();
	});

	it("skips uncached songs in offline mode", () => {
		const mockPlayNext = jest.fn();
		const mockIsSongCached = jest.fn(() => false);

		mockUsePlayerActions.mockReturnValue({
			togglePlayPause: jest.fn(),
			playNext: mockPlayNext,
			playPrevious: jest.fn(),
			seekTo: jest.fn(),
			setVolume: jest.fn(),
			removeFromQueue: jest.fn(),
		});

		mockUseDownloadsActions.mockReturnValue({
			getSongBlob: jest.fn(() => null),
			isSongCached: mockIsSongCached,
		});

		mockUseOffline.mockReturnValue({
			isOfflineMode: true,
		});

		render(<AudioPlayer />);

		expect(mockIsSongCached).toHaveBeenCalledWith("song1");
		expect(mockToast.error).toHaveBeenCalledWith(
			'"Test Song" is not available offline. Skipping...',
		);
		expect(mockAudioRef.current!.src).toBe("http://localhost/"); // JSDOM resolves empty src to base URL
		expect(mockAudioRef.current!.load).toHaveBeenCalled();
		expect(mockPlayNext).toHaveBeenCalled();
	});

	it("loads cached audio blob when available", () => {
		const mockBlob = new Blob(["audio data"], { type: "audio/mpeg" });
		const mockGetSongBlob = jest.fn(() => mockBlob);

		mockUseDownloadsActions.mockReturnValue({
			getSongBlob: mockGetSongBlob,
			isSongCached: jest.fn(() => true),
		});

		render(<AudioPlayer />);

		expect(mockGetSongBlob).toHaveBeenCalledWith("song1");
		expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
		expect(mockAudioRef.current!.src).toBe("blob:mock-url");
		expect(mockAudioRef.current!.load).toHaveBeenCalled();
	});

	it("loads remote URL when no cached blob and not offline", () => {
		render(<AudioPlayer />);

		expect(mockAudioRef.current!.src).toContain("audio-320.mp3");
		expect(mockAudioRef.current!.load).toHaveBeenCalled();
	});

	it("does not load remote URL in offline mode without cache", () => {
		mockUseDownloadsActions.mockReturnValue({
			getSongBlob: jest.fn(() => null),
			isSongCached: jest.fn(() => true),
		});

		mockUseOffline.mockReturnValue({
			isOfflineMode: true,
		});

		render(<AudioPlayer />);

		expect(mockAudioRef.current!.src).toBe("");
		expect(mockAudioRef.current!.load).not.toHaveBeenCalled();
	});

	it("syncs play/pause state with audio element", () => {
		(mockAudioRef.current as any).paused = true;

		const { rerender } = render(<AudioPlayer />);

		// Initially not playing, should not call play/pause
		expect(mockAudioRef.current!.play).not.toHaveBeenCalled();
		expect(mockAudioRef.current!.pause).not.toHaveBeenCalled();

		// Change to playing
		mockUsePlayback.mockReturnValue({
			currentSong: mockSong,
			isPlaying: true,
			volume: 0.7,
			currentTime: 0,
			duration: 180,
			audioRef: mockAudioRef,
		});

		rerender(<AudioPlayer />);

		expect(mockAudioRef.current!.play).toHaveBeenCalled();
	});

	it("sets up Media Session metadata when song changes", () => {
		render(<AudioPlayer />);

		expect(global.MediaMetadata).toHaveBeenCalledWith({
			title: "Test Song",
			artist: "Test Artist",
			album: "Test Album",
			artwork: [
				{ src: "small.jpg", sizes: "50x50", type: "image/jpeg" },
				{ src: "medium.jpg", sizes: "150x150", type: "image/jpeg" },
				{ src: "large.jpg", sizes: "500x500", type: "image/jpeg" },
			],
		});
		expect(navigator.mediaSession.metadata).toEqual({
			title: "Test Song",
			artist: "Test Artist",
			album: "Test Album",
			artwork: [
				{ src: "small.jpg", sizes: "50x50", type: "image/jpeg" },
				{ src: "medium.jpg", sizes: "150x150", type: "image/jpeg" },
				{ src: "large.jpg", sizes: "500x500", type: "image/jpeg" },
			],
		});
	});

	it("sets up Media Session action handlers", () => {
		const mockPlayNext = jest.fn();
		const mockPlayPrevious = jest.fn();
		const mockSeekTo = jest.fn();

		mockUsePlayerActions.mockReturnValue({
			togglePlayPause: jest.fn(),
			playNext: mockPlayNext,
			playPrevious: mockPlayPrevious,
			seekTo: mockSeekTo,
			setVolume: jest.fn(),
			removeFromQueue: jest.fn(),
		});

		(mockAudioRef.current as any).currentTime = 30;
		(mockAudioRef.current as any).duration = 180;
		(mockAudioRef.current as any).playbackRate = 1;

		render(<AudioPlayer />);

		expect(navigator.mediaSession.setActionHandler).toHaveBeenCalledWith(
			"play",
			expect.any(Function),
		);
		expect(navigator.mediaSession.setActionHandler).toHaveBeenCalledWith(
			"pause",
			expect.any(Function),
		);
		expect(navigator.mediaSession.setActionHandler).toHaveBeenCalledWith(
			"previoustrack",
			mockPlayPrevious,
		);
		expect(navigator.mediaSession.setActionHandler).toHaveBeenCalledWith(
			"nexttrack",
			mockPlayNext,
		);
		expect(navigator.mediaSession.setActionHandler).toHaveBeenCalledWith(
			"seekto",
			expect.any(Function),
		);
	});

	it("updates Media Session position state", () => {
		render(<AudioPlayer />);

		expect(navigator.mediaSession.setPositionState).toHaveBeenCalledWith({
			duration: 180,
			playbackRate: 1,
			position: 0,
		});
	});
});

it("updates Media Session position state", () => {
	render(<AudioPlayer />);

	expect(navigator.mediaSession.setPositionState).toHaveBeenCalledWith({
		duration: 180,
		playbackRate: 1,
		position: 0,
	});
});
