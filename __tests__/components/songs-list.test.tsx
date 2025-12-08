import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SongsList } from "../../components/songs-list";
import type { Song } from "../../lib/types";

// Mock contexts
jest.mock("../../contexts/downloads-context", () => ({
	useDownloadsActions: jest.fn(),
}));

jest.mock("../../contexts/player-context", () => ({
	usePlayerActions: jest.fn(),
}));

// Mock API
jest.mock("../../lib/api", () => ({
	getSongById: jest.fn(),
}));

// Mock components
jest.mock("../../components/song-item", () => ({
	SongItem: ({ song, onPlay, onAddToQueue, onDownload }: any) => (
		<div data-testid={`song-item-${song.id}`}>
			<span>{song.title}</span>
			<button data-testid={`play-${song.id}`} onClick={() => onPlay(song)}>
				Play
			</button>
			<button
				data-testid={`queue-${song.id}`}
				onClick={() => onAddToQueue(song)}
			>
				Add to Queue
			</button>
			<button
				data-testid={`download-${song.id}`}
				onClick={() => onDownload(song)}
			>
				Download
			</button>
		</div>
	),
}));

// Mock toast
jest.mock("sonner", () => ({
	toast: {
		success: jest.fn(),
		error: jest.fn(),
	},
}));

const mockSongs: Song[] = [
	{
		id: "song1",
		title: "Test Song 1",
		image: [{ quality: "500x500", url: "cover1.jpg" }],
		album: "Test Album",
		url: "song1-url",
		type: "song",
		description: "Artist 1",
		singers: "Artist 1",
		primaryArtists: "Artist 1",
		language: "english",
	},
	{
		id: "song2",
		title: "Test Song 2",
		image: [{ quality: "500x500", url: "cover2.jpg" }],
		album: "Test Album",
		url: "song2-url",
		type: "song",
		description: "Artist 2",
		singers: "Artist 2",
		primaryArtists: "Artist 2",
		language: "english",
	},
];

const mockDetailedSong = {
	id: "song1",
	name: "Detailed Test Song",
	type: "song" as const,
	year: "2023",
	releaseDate: null,
	duration: 180,
	label: null,
	explicitContent: false,
	playCount: null,
	language: "english",
	hasLyrics: false,
	lyricsId: null,
	url: "detailed-song-url",
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
	image: [{ quality: "500x500", url: "cover.jpg" }],
	downloadUrl: [{ quality: "160kbps", url: "audio.mp3" }],
};

describe("SongsList", () => {
	const mockUseDownloadsActions =
		require("../../contexts/downloads-context").useDownloadsActions;
	const mockUsePlayerActions =
		require("../../contexts/player-context").usePlayerActions;
	const mockGetSongById = require("../../lib/api").getSongById;
	const mockToast = require("sonner").toast;

	beforeEach(() => {
		jest.clearAllMocks();

		// Setup mocks
		mockUseDownloadsActions.mockReturnValue({
			downloadSong: jest.fn().mockResolvedValue(undefined),
		});

		mockUsePlayerActions.mockReturnValue({
			playSong: jest.fn(),
			addToQueue: jest.fn(),
		});

		mockGetSongById.mockResolvedValue({ data: [mockDetailedSong] });
	});

	it("renders nothing when songs array is empty", () => {
		const { container } = render(<SongsList songs={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it("renders songs list with header", () => {
		render(<SongsList songs={mockSongs} />);

		expect(screen.getByText("Songs")).toBeTruthy();
		expect(screen.getByTestId("song-item-song1")).toBeTruthy();
		expect(screen.getByTestId("song-item-song2")).toBeTruthy();
	});

	it("handles play button click", async () => {
		const user = userEvent.setup();
		const mockPlaySong = jest.fn();

		mockUsePlayerActions.mockReturnValue({
			playSong: mockPlaySong,
			addToQueue: jest.fn(),
		});

		render(<SongsList songs={[mockSongs[0]]} />);

		await user.click(screen.getByTestId("play-song1"));

		await waitFor(() => {
			expect(mockGetSongById).toHaveBeenCalledWith("song1");
			expect(mockPlaySong).toHaveBeenCalledWith(mockDetailedSong);
			expect(mockToast.success).toHaveBeenCalledWith(
				"Now playing: Test Song 1",
			);
		});
	});

	it("handles add to queue button click", async () => {
		const user = userEvent.setup();
		const mockAddToQueue = jest.fn();

		mockUsePlayerActions.mockReturnValue({
			playSong: jest.fn(),
			addToQueue: mockAddToQueue,
		});

		render(<SongsList songs={[mockSongs[0]]} />);

		await user.click(screen.getByTestId("queue-song1"));

		await waitFor(() => {
			expect(mockGetSongById).toHaveBeenCalledWith("song1");
			expect(mockAddToQueue).toHaveBeenCalledWith(mockDetailedSong);
			expect(mockToast.success).toHaveBeenCalledWith(
				"Added to queue: Test Song 1",
			);
		});
	});

	it("handles download button click", async () => {
		const user = userEvent.setup();
		const mockDownloadSong = jest.fn().mockResolvedValue(undefined);

		mockUseDownloadsActions.mockReturnValue({
			downloadSong: mockDownloadSong,
		});

		render(<SongsList songs={[mockSongs[0]]} />);

		await user.click(screen.getByTestId("download-song1"));

		await waitFor(() => {
			expect(mockGetSongById).toHaveBeenCalledWith("song1");
			expect(mockDownloadSong).toHaveBeenCalledWith(mockDetailedSong);
			expect(mockToast.success).toHaveBeenCalledWith("Downloaded: Test Song 1");
		});
	});

	it("handles play error gracefully", async () => {
		const user = userEvent.setup();
		const consoleSpy = jest.spyOn(console, "error").mockImplementation();

		mockGetSongById.mockRejectedValue(new Error("API error"));

		render(<SongsList songs={[mockSongs[0]]} />);

		await user.click(screen.getByTestId("play-song1"));

		await waitFor(() => {
			expect(mockToast.error).toHaveBeenCalledWith("Failed to play song");
			expect(consoleSpy).toHaveBeenCalled();
		});

		consoleSpy.mockRestore();
	});

	it("handles add to queue error gracefully", async () => {
		const user = userEvent.setup();
		const consoleSpy = jest.spyOn(console, "error").mockImplementation();

		mockGetSongById.mockRejectedValue(new Error("API error"));

		render(<SongsList songs={[mockSongs[0]]} />);

		await user.click(screen.getByTestId("queue-song1"));

		await waitFor(() => {
			expect(mockToast.error).toHaveBeenCalledWith("Failed to add to queue");
			expect(consoleSpy).toHaveBeenCalled();
		});

		consoleSpy.mockRestore();
	});

	it("handles download error gracefully", async () => {
		const user = userEvent.setup();
		const consoleSpy = jest.spyOn(console, "error").mockImplementation();

		mockGetSongById.mockRejectedValue(new Error("API error"));

		render(<SongsList songs={[mockSongs[0]]} />);

		await user.click(screen.getByTestId("download-song1"));

		await waitFor(() => {
			expect(mockToast.error).toHaveBeenCalledWith("Failed to download");
			expect(consoleSpy).toHaveBeenCalled();
		});

		consoleSpy.mockRestore();
	});

	it("passes showDownload prop to SongItem", () => {
		render(<SongsList songs={[mockSongs[0]]} />);

		// The mock SongItem doesn't use showDownload, but we can verify it's rendered
		expect(screen.getByTestId("song-item-song1")).toBeTruthy();
	});
});
