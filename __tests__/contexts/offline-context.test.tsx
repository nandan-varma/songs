import { act, render, screen } from "@testing-library/react";
import { OfflineProvider, useOffline } from "../../contexts/offline-context";
import type { DetailedSong, Song } from "../../lib/types";

// Mock contexts
jest.mock("../../contexts/downloads-context", () => ({
	useDownloadsActions: jest.fn(),
	useDownloadsState: jest.fn(),
}));

// Mock toast
jest.mock("sonner", () => ({
	toast: {
		warning: jest.fn(),
		success: jest.fn(),
	},
}));

const mockSong: Song = {
	id: "song1",
	title: "Test Song",
	image: [{ quality: "500x500", url: "cover.jpg" }],
	album: "Test Album",
	url: "song-url",
	type: "song",
	description: "Artist 1",
	singers: "Artist 1",
	primaryArtists: "Artist 1",
	language: "english",
};

const mockDetailedSong: DetailedSong = {
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
				name: "Artist 1",
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
				name: "Artist 1",
				role: "primary" as const,
				type: "artist" as const,
				image: [],
				url: "artist-url",
			},
		],
	},
	image: [{ quality: "500x500", url: "cover.jpg" }],
	downloadUrl: [{ quality: "320kbps", url: "audio.mp3" }],
};

const mockCachedSong = {
	song: mockDetailedSong,
	blob: new Blob(["audio data"], { type: "audio/mpeg" }),
};

describe("OfflineProvider", () => {
	const mockUseDownloadsActions =
		require("../../contexts/downloads-context").useDownloadsActions;
	const mockUseDownloadsState =
		require("../../contexts/downloads-context").useDownloadsState;
	const _mockToast = require("sonner").toast;

	let mockIsSongCached: jest.Mock;
	let mockCachedSongs: Map<string, unknown>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockIsSongCached = jest.fn();
		mockCachedSongs = new Map();

		mockUseDownloadsActions.mockReturnValue({
			isSongCached: mockIsSongCached,
		});

		mockUseDownloadsState.mockReturnValue({
			cachedSongs: mockCachedSongs,
		});

		// Mock navigator.onLine
		Object.defineProperty(navigator, "onLine", {
			writable: true,
			value: true,
		});

		// Mock window event listeners
		window.addEventListener = jest.fn();
		window.removeEventListener = jest.fn();
	});

	it("renders children", () => {
		render(
			<OfflineProvider>
				<div data-testid="child">Test</div>
			</OfflineProvider>,
		);
		expect(screen.getByTestId("child")).toBeTruthy();
	});

	it("provides initial state when online", () => {
		let offlineData: any;

		function Consumer() {
			offlineData = useOffline();
			return null;
		}

		render(
			<OfflineProvider>
				<Consumer />
			</OfflineProvider>,
		);

		expect(offlineData.isOfflineMode).toBe(false);
		expect(offlineData.cachedSongsCount).toBe(0);
		expect(typeof offlineData.setOfflineMode).toBe("function");
		expect(typeof offlineData.getFilteredSongs).toBe("function");
		expect(typeof offlineData.getCachedSongsOnly).toBe("function");
		expect(typeof offlineData.isOnlineContentAvailable).toBe("function");
		expect(typeof offlineData.shouldEnableQuery).toBe("function");
	});

	it("throws error when hook used outside provider", () => {
		const consoleSpy = jest.spyOn(console, "error").mockImplementation();

		function TestOffline() {
			useOffline();
			return null;
		}

		expect(() => render(<TestOffline />)).toThrow(
			"useOffline must be used within an OfflineProvider",
		);

		consoleSpy.mockRestore();
	});

	it("detects offline mode when navigator.onLine is false", () => {
		Object.defineProperty(navigator, "onLine", {
			writable: true,
			value: false,
		});

		let offlineData: any;

		function Consumer() {
			offlineData = useOffline();
			return null;
		}

		render(
			<OfflineProvider>
				<Consumer />
			</OfflineProvider>,
		);

		expect(offlineData.isOfflineMode).toBe(true);
	});

	it("listens for online/offline events", () => {
		render(
			<OfflineProvider>
				<div>Test</div>
			</OfflineProvider>,
		);

		expect(window.addEventListener).toHaveBeenCalledWith(
			"online",
			expect.any(Function),
		);
		expect(window.addEventListener).toHaveBeenCalledWith(
			"offline",
			expect.any(Function),
		);
	});

	it("setOfflineMode is no-op (automatic based on network)", () => {
		let offlineData: any;

		function Consumer() {
			offlineData = useOffline();
			return null;
		}

		render(
			<OfflineProvider>
				<Consumer />
			</OfflineProvider>,
		);

		// Should not change anything
		act(() => {
			offlineData.setOfflineMode(true);
		});

		expect(offlineData.isOfflineMode).toBe(false);
	});

	it("getFilteredSongs returns all songs when online", () => {
		let offlineData: any;

		function Consumer() {
			offlineData = useOffline();
			return null;
		}

		render(
			<OfflineProvider>
				<Consumer />
			</OfflineProvider>,
		);

		const songs = [mockSong];
		const filtered = offlineData.getFilteredSongs(songs);

		expect(filtered).toEqual(songs);
	});

	it("getFilteredSongs filters to cached songs when offline", () => {
		Object.defineProperty(navigator, "onLine", {
			writable: true,
			value: false,
		});

		mockIsSongCached.mockReturnValue(true);

		let offlineData: any;

		function Consumer() {
			offlineData = useOffline();
			return null;
		}

		render(
			<OfflineProvider>
				<Consumer />
			</OfflineProvider>,
		);

		const songs = [mockSong];
		const filtered = offlineData.getFilteredSongs(songs);

		expect(mockIsSongCached).toHaveBeenCalledWith("song1");
		expect(filtered).toEqual(songs);
	});

	it("getFilteredSongs filters out uncached songs when offline", () => {
		Object.defineProperty(navigator, "onLine", {
			writable: true,
			value: false,
		});

		mockIsSongCached.mockReturnValue(false);

		let offlineData: any;

		function Consumer() {
			offlineData = useOffline();
			return null;
		}

		render(
			<OfflineProvider>
				<Consumer />
			</OfflineProvider>,
		);

		const songs = [mockSong];
		const filtered = offlineData.getFilteredSongs(songs);

		expect(filtered).toEqual([]);
	});

	it("getCachedSongsOnly returns cached songs", () => {
		mockCachedSongs.set("song1", mockCachedSong);

		let offlineData: any;

		function Consumer() {
			offlineData = useOffline();
			return null;
		}

		render(
			<OfflineProvider>
				<Consumer />
			</OfflineProvider>,
		);

		const cachedSongs = offlineData.getCachedSongsOnly();

		expect(cachedSongs).toEqual([mockDetailedSong]);
	});

	it("isOnlineContentAvailable returns true when online", () => {
		let offlineData: any;

		function Consumer() {
			offlineData = useOffline();
			return null;
		}

		render(
			<OfflineProvider>
				<Consumer />
			</OfflineProvider>,
		);

		const available = offlineData.isOnlineContentAvailable([mockSong]);

		expect(available).toBe(true);
	});

	it("isOnlineContentAvailable checks cache when offline", () => {
		Object.defineProperty(navigator, "onLine", {
			writable: true,
			value: false,
		});

		mockIsSongCached.mockReturnValue(true);

		let offlineData: any;

		function Consumer() {
			offlineData = useOffline();
			return null;
		}

		render(
			<OfflineProvider>
				<Consumer />
			</OfflineProvider>,
		);

		const available = offlineData.isOnlineContentAvailable([mockSong]);

		expect(mockIsSongCached).toHaveBeenCalledWith("song1");
		expect(available).toBe(true);
	});

	it("shouldEnableQuery returns true when online", () => {
		let offlineData: any;

		function Consumer() {
			offlineData = useOffline();
			return null;
		}

		render(
			<OfflineProvider>
				<Consumer />
			</OfflineProvider>,
		);

		expect(offlineData.shouldEnableQuery()).toBe(true);
	});

	it("shouldEnableQuery returns false when offline", () => {
		Object.defineProperty(navigator, "onLine", {
			writable: true,
			value: false,
		});

		let offlineData: any;

		function Consumer() {
			offlineData = useOffline();
			return null;
		}

		render(
			<OfflineProvider>
				<Consumer />
			</OfflineProvider>,
		);

		expect(offlineData.shouldEnableQuery()).toBe(false);
	});

	it("updates cachedSongsCount when cache changes", () => {
		mockCachedSongs.set("song1", mockCachedSong);

		let offlineData: any;

		function Consumer() {
			offlineData = useOffline();
			return null;
		}

		render(
			<OfflineProvider>
				<Consumer />
			</OfflineProvider>,
		);

		expect(offlineData.cachedSongsCount).toBe(1);
	});
});
