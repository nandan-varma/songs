import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "@testing-library/react";
import { DownloadButton } from "../components/download-button";
import { toast } from "sonner";

// Mock contexts
jest.mock("../contexts/downloads-context", () => ({
	useDownloadsActions: jest.fn(),
}));

jest.mock("sonner", () => ({
	toast: {
		success: jest.fn(),
		info: jest.fn(),
	},
}));

const mockToast = require("sonner").toast;

const mockSong = {
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

describe("DownloadButton", () => {
	const mockUseDownloadsActions =
		require("../contexts/downloads-context").useDownloadsActions;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders download icon when not cached", () => {
		mockUseDownloadsActions.mockReturnValue({
			downloadSong: jest.fn(),
			isSongCached: jest.fn(() => false),
		});

		render(<DownloadButton song={mockSong} />);

		expect(screen.getByRole("button")).toBeInTheDocument();
		expect(screen.getByLabelText("Download song")).toBeInTheDocument();
	});

	it("renders check icon when cached", () => {
		mockUseDownloadsActions.mockReturnValue({
			downloadSong: jest.fn(),
			isSongCached: jest.fn(() => true),
		});

		render(<DownloadButton song={mockSong} />);

		expect(screen.getByLabelText("Already downloaded")).toBeInTheDocument();
		expect(screen.getByRole("button")).toBeDisabled();
	});

	it("calls downloadSong and shows success toast on click", async () => {
		const mockDownloadSong = jest.fn().mockResolvedValue(undefined);
		mockUseDownloadsActions.mockReturnValue({
			downloadSong: mockDownloadSong,
			isSongCached: jest.fn(() => false),
		});

		render(<DownloadButton song={mockSong} />);

		await act(async () => {
			fireEvent.click(screen.getByRole("button"));
		});

		expect(mockDownloadSong).toHaveBeenCalledWith(mockSong);
		expect(mockToast.success).toHaveBeenCalledWith("Downloaded: Test Song");
	});

	it("disables button when already downloaded", () => {
		mockUseDownloadsActions.mockReturnValue({
			downloadSong: jest.fn(),
			isSongCached: jest.fn(() => true),
		});

		render(<DownloadButton song={mockSong} />);

		expect(screen.getByRole("button")).toBeDisabled();
	});

	it("shows label when showLabel is true", () => {
		mockUseDownloadsActions.mockReturnValue({
			downloadSong: jest.fn(),
			isSongCached: jest.fn(() => false),
		});

		render(<DownloadButton song={mockSong} showLabel />);

		expect(screen.getByText("Download")).toBeInTheDocument();
	});

	it("shows downloaded label when cached and showLabel", () => {
		mockUseDownloadsActions.mockReturnValue({
			downloadSong: jest.fn(),
			isSongCached: jest.fn(() => true),
		});

		render(<DownloadButton song={mockSong} showLabel />);

		expect(screen.getByText("Downloaded")).toBeInTheDocument();
	});
});
