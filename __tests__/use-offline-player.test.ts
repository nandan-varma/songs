import { renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { useOfflinePlayerActions } from "../hooks/use-offline-player";
import type { DetailedSong } from "../lib/types";

// Mock toast
jest.mock("sonner", () => ({
	toast: {
		error: jest.fn(),
		info: jest.fn(),
	},
}));

// Mock contexts
jest.mock("../contexts/offline-context", () => ({
	useOffline: jest.fn(() => ({
		isOfflineMode: false,
		getFilteredSongs: jest.fn().mockImplementation((songs: any) => songs), // Return all songs by default
	})),
}));

const mockUseOffline = require("../contexts/offline-context").useOffline;

jest.mock("../contexts/player-context", () => ({
	usePlayerActions: () => ({
		playSong: jest.fn(),
		addToQueue: jest.fn(),
		addMultipleToQueue: jest.fn(),
		playQueue: jest.fn(),
	}),
}));

const mockSong: DetailedSong = {
	id: "1",
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
				role: "primary",
				type: "artist",
				image: [],
				url: "artist-url",
			},
		],
		featured: [],
		all: [
			{
				id: "artist1",
				name: "Test Artist",
				role: "primary",
				type: "artist",
				image: [],
				url: "artist-url",
			},
		],
	},
	image: [{ quality: "500x500", url: "cover.jpg" }],
	downloadUrl: [{ quality: "160kbps", url: "audio.mp3" }],
};

describe("useOfflinePlayerActions", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("playSongOfflineAware", () => {
		it("plays song when online", () => {
			const { result } = renderHook(() => useOfflinePlayerActions());

			result.current.playSong(mockSong);

			expect(result.current.playSongUnfiltered).toHaveBeenCalledWith(
				mockSong,
				true,
			);
		});

		it("shows error when song not available offline", () => {
			mockUseOffline.mockReturnValue({
				isOfflineMode: true,
				getFilteredSongs: jest.fn().mockReturnValue([]),
			});

			const { result } = renderHook(() => useOfflinePlayerActions());

			result.current.playSong(mockSong);

			expect(toast.error).toHaveBeenCalledWith("Song not available offline");
			expect(result.current.playSongUnfiltered).not.toHaveBeenCalled();
		});

		it("plays song when available offline", () => {
			mockUseOffline.mockReturnValue({
				isOfflineMode: true,
				getFilteredSongs: jest.fn(() => [mockSong]),
			});

			const { result } = renderHook(() => useOfflinePlayerActions());

			result.current.playSong(mockSong);

			expect(result.current.playSongUnfiltered).toHaveBeenCalledWith(
				mockSong,
				true,
			);
		});
	});

	describe("playQueueOfflineAware", () => {
		it("plays all songs when online", () => {
			const songs = [mockSong];
			const { result } = renderHook(() => useOfflinePlayerActions());

			result.current.playQueue(songs);

			expect(result.current.playQueueUnfiltered).toHaveBeenCalledWith(songs, 0);
		});

		it("shows error when no songs available offline", () => {
			mockUseOffline.mockReturnValue({
				isOfflineMode: true,
				getFilteredSongs: jest.fn().mockReturnValue([]),
			});

			const { result } = renderHook(() => useOfflinePlayerActions());

			result.current.playQueue([mockSong]);

			expect(toast.error).toHaveBeenCalledWith(
				"No cached songs available for offline playback",
			);
		});

		it("plays filtered songs and shows info when some unavailable offline", () => {
			const songs = [mockSong, { ...mockSong, id: "2" }];
			mockUseOffline.mockReturnValue({
				isOfflineMode: true,
				getFilteredSongs: jest.fn(() => [mockSong]), // Only first song available
			});

			const { result } = renderHook(() => useOfflinePlayerActions());

			result.current.playQueue(songs);

			expect(toast.info).toHaveBeenCalledWith(
				"Playing 1 of 2 songs (offline mode)",
			);
			expect(result.current.playQueueUnfiltered).toHaveBeenCalledWith(
				[mockSong],
				0,
			);
		});
	});

	describe("addToQueueOfflineAware", () => {
		it("adds song when available offline", () => {
			mockUseOffline.mockReturnValue({
				isOfflineMode: true,
				getFilteredSongs: jest.fn(() => [mockSong]),
			});

			const { result } = renderHook(() => useOfflinePlayerActions());

			result.current.addToQueue(mockSong);

			expect(result.current.addToQueueUnfiltered).toHaveBeenCalledWith(
				mockSong,
			);
		});

		it("shows error when song not available offline", () => {
			mockUseOffline.mockReturnValue({
				isOfflineMode: true,
				getFilteredSongs: jest.fn().mockReturnValue([]),
			});

			const { result } = renderHook(() => useOfflinePlayerActions());

			result.current.addToQueue(mockSong);

			expect(toast.error).toHaveBeenCalledWith("Song not available offline");
		});
	});

	describe("addMultipleToQueueOfflineAware", () => {
		it("adds all songs when available offline", () => {
			const songs = [mockSong];
			mockUseOffline.mockReturnValue({
				isOfflineMode: true,
				getFilteredSongs: jest.fn(() => songs),
			});

			const { result } = renderHook(() => useOfflinePlayerActions());

			result.current.addMultipleToQueue(songs);

			expect(result.current.addMultipleToQueueUnfiltered).toHaveBeenCalledWith(
				songs,
			);
		});

		it("shows info when some songs unavailable offline", () => {
			const songs = [mockSong, { ...mockSong, id: "2" }];
			mockUseOffline.mockReturnValue({
				isOfflineMode: true,
				getFilteredSongs: jest.fn(() => [mockSong]),
			});

			const { result } = renderHook(() => useOfflinePlayerActions());

			result.current.addMultipleToQueue(songs);

			expect(toast.info).toHaveBeenCalledWith(
				"Added 1 of 2 songs (offline mode)",
			);
			expect(result.current.addMultipleToQueueUnfiltered).toHaveBeenCalledWith([
				mockSong,
			]);
		});
	});
});
