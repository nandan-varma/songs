import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SongItem } from "../../components/song-item";
import type { Song } from "../../lib/types";

// Mock contexts
jest.mock("../../contexts/downloads-context", () => ({
	useDownloadsActions: jest.fn(),
}));

// Mock Next.js Link
jest.mock("next/link", () => ({
	__esModule: true,
	default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock ProgressiveImage
jest.mock("../../components/progressive-image", () => ({
	ProgressiveImage: ({ alt }: { alt: string }) => (
		<div data-testid="progressive-image" aria-label={alt}>
			Image
		</div>
	),
}));

// Mock UI components
jest.mock("../../components/ui/card", () => ({
	Card: ({ children, className }: any) => (
		<div className={className} data-testid="card">
			{children}
		</div>
	),
	CardContent: ({ children, className }: any) => (
		<div className={className} data-testid="card-content">
			{children}
		</div>
	),
}));

jest.mock("../../components/ui/button", () => ({
	Button: ({
		children,
		onClick,
		disabled,
		"aria-label": ariaLabel,
		className,
		size,
		variant,
	}: any) => (
		<button
			onClick={onClick}
			disabled={disabled}
			aria-label={ariaLabel}
			className={className}
			data-size={size}
			data-variant={variant}
		>
			{children}
		</button>
	),
}));

// Mock Lucide icons
jest.mock("lucide-react", () => ({
	Play: () => <div data-testid="play-icon">Play</div>,
	Plus: () => <div data-testid="plus-icon">Plus</div>,
	Download: () => <div data-testid="download-icon">Download</div>,
	Check: () => <div data-testid="check-icon">Check</div>,
	Music: () => <div data-testid="music-icon">Music</div>,
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

const mockSongWithoutImage: Song = {
	...mockSong,
	image: [],
};

describe("SongItem", () => {
	const mockUseDownloadsActions =
		require("../../contexts/downloads-context").useDownloadsActions;

	beforeEach(() => {
		jest.clearAllMocks();
		mockUseDownloadsActions.mockReturnValue({
			isSongCached: jest.fn().mockReturnValue(false),
		});
	});

	it("renders song information correctly", () => {
		const mockOnPlay = jest.fn();
		const mockOnAddToQueue = jest.fn();
		const mockOnDownload = jest.fn();

		render(
			<SongItem
				song={mockSong}
				onPlay={mockOnPlay}
				onAddToQueue={mockOnAddToQueue}
				onDownload={mockOnDownload}
			/>,
		);

		expect(screen.getByRole("heading", { name: "Test Song" })).toBeTruthy();
		expect(screen.getByText("Artist 1")).toBeTruthy();
		expect(screen.getByText("Test Album")).toBeTruthy();
		expect(screen.getByTestId("progressive-image")).toBeTruthy();
		expect(screen.getByRole("link", { name: /test song/i })).toBeTruthy();
	});

	it("renders fallback icon when no image is provided", () => {
		const mockOnPlay = jest.fn();
		const mockOnAddToQueue = jest.fn();

		render(
			<SongItem
				song={mockSongWithoutImage}
				onPlay={mockOnPlay}
				onAddToQueue={mockOnAddToQueue}
			/>,
		);

		expect(screen.getByTestId("music-icon")).toBeTruthy();
	});

	it("calls onPlay when play button is clicked", async () => {
		const user = userEvent.setup();
		const mockOnPlay = jest.fn();
		const mockOnAddToQueue = jest.fn();
		const mockOnDownload = jest.fn();

		render(
			<SongItem
				song={mockSong}
				onPlay={mockOnPlay}
				onAddToQueue={mockOnAddToQueue}
				onDownload={mockOnDownload}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Play song" }));

		expect(mockOnPlay).toHaveBeenCalledWith(mockSong);
		expect(mockOnPlay).toHaveBeenCalledTimes(1);
	});

	it("calls onAddToQueue when add to queue button is clicked", async () => {
		const user = userEvent.setup();
		const mockOnPlay = jest.fn();
		const mockOnAddToQueue = jest.fn();
		const mockOnDownload = jest.fn();

		render(
			<SongItem
				song={mockSong}
				onPlay={mockOnPlay}
				onAddToQueue={mockOnAddToQueue}
				onDownload={mockOnDownload}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Add to queue" }));

		expect(mockOnAddToQueue).toHaveBeenCalledWith(mockSong);
		expect(mockOnAddToQueue).toHaveBeenCalledTimes(1);
	});

	it("calls onDownload when download button is clicked", async () => {
		const user = userEvent.setup();
		const mockOnPlay = jest.fn();
		const mockOnAddToQueue = jest.fn();
		const mockOnDownload = jest.fn();

		render(
			<SongItem
				song={mockSong}
				onPlay={mockOnPlay}
				onAddToQueue={mockOnAddToQueue}
				onDownload={mockOnDownload}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Download song" }));

		expect(mockOnDownload).toHaveBeenCalledWith(mockSong);
		expect(mockOnDownload).toHaveBeenCalledTimes(1);
	});

	it("shows download button as disabled when song is already downloaded", () => {
		mockUseDownloadsActions.mockReturnValue({
			isSongCached: jest.fn().mockReturnValue(true),
		});

		const mockOnPlay = jest.fn();
		const mockOnAddToQueue = jest.fn();
		const mockOnDownload = jest.fn();

		render(
			<SongItem
				song={mockSong}
				onPlay={mockOnPlay}
				onAddToQueue={mockOnAddToQueue}
				onDownload={mockOnDownload}
			/>,
		);

		const downloadButton = screen.getByRole("button", {
			name: "Already downloaded",
		});
		expect((downloadButton as HTMLButtonElement).disabled).toBe(true);
		expect(downloadButton.className).toContain("text-green-600");
	});

	it("shows check icon when song is downloaded", () => {
		mockUseDownloadsActions.mockReturnValue({
			isSongCached: jest.fn().mockReturnValue(true),
		});

		const mockOnPlay = jest.fn();
		const mockOnAddToQueue = jest.fn();

		render(
			<SongItem
				song={mockSong}
				onPlay={mockOnPlay}
				onAddToQueue={mockOnAddToQueue}
			/>,
		);

		expect(screen.getByTestId("check-icon")).toBeTruthy();
	});

	it("hides download button when showDownload is false", () => {
		const mockOnPlay = jest.fn();
		const mockOnAddToQueue = jest.fn();
		const mockOnDownload = jest.fn();

		render(
			<SongItem
				song={mockSong}
				onPlay={mockOnPlay}
				onAddToQueue={mockOnAddToQueue}
				onDownload={mockOnDownload}
				showDownload={false}
			/>,
		);

		expect(
			screen.queryByRole("button", { name: /download/i }),
		).not.toBeTruthy();
	});

	it("disables download button when onDownload is not provided", () => {
		const mockOnPlay = jest.fn();
		const mockOnAddToQueue = jest.fn();

		render(
			<SongItem
				song={mockSong}
				onPlay={mockOnPlay}
				onAddToQueue={mockOnAddToQueue}
			/>,
		);

		const downloadButton = screen.getByRole("button", {
			name: "Download song",
		});
		expect((downloadButton as HTMLButtonElement).disabled).toBe(true);
	});

	it("prevents event propagation on button clicks", async () => {
		const user = userEvent.setup();
		const mockOnPlay = jest.fn();
		const mockOnAddToQueue = jest.fn();
		const mockOnDownload = jest.fn();

		// Mock parent click handler
		const mockParentClick = jest.fn();
		const { container } = render(
			<div onClick={mockParentClick}>
				<SongItem
					song={mockSong}
					onPlay={mockOnPlay}
					onAddToQueue={mockOnAddToQueue}
					onDownload={mockOnDownload}
				/>
			</div>,
		);

		await user.click(screen.getByRole("button", { name: "Play song" }));

		expect(mockParentClick).not.toHaveBeenCalled();
	});

	it("links to song detail page", () => {
		const mockOnPlay = jest.fn();
		const mockOnAddToQueue = jest.fn();

		render(
			<SongItem
				song={mockSong}
				onPlay={mockOnPlay}
				onAddToQueue={mockOnAddToQueue}
			/>,
		);

		const link = screen.getByRole("link", { name: /test song/i });
		expect(link.getAttribute("href")).toBe("/songs/song1");
	});

	it("has proper accessibility labels", () => {
		const mockOnPlay = jest.fn();
		const mockOnAddToQueue = jest.fn();
		const mockOnDownload = jest.fn();

		render(
			<SongItem
				song={mockSong}
				onPlay={mockOnPlay}
				onAddToQueue={mockOnAddToQueue}
				onDownload={mockOnDownload}
			/>,
		);

		expect(screen.getByRole("button", { name: "Play song" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Add to queue" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Download song" })).toBeTruthy();
	});

	it("applies hover styles", () => {
		const mockOnPlay = jest.fn();
		const mockOnAddToQueue = jest.fn();

		const { container } = render(
			<SongItem
				song={mockSong}
				onPlay={mockOnPlay}
				onAddToQueue={mockOnAddToQueue}
			/>,
		);

		const card = container.firstChild as HTMLElement;
		expect(card.className).toContain("hover:bg-accent/50");
	});

	it("handles songs with missing metadata gracefully", () => {
		const incompleteSong: Song = {
			...mockSong,
			primaryArtists: "",
			album: "",
		};

		const mockOnPlay = jest.fn();
		const mockOnAddToQueue = jest.fn();

		expect(() => {
			render(
				<SongItem
					song={incompleteSong}
					onPlay={mockOnPlay}
					onAddToQueue={mockOnAddToQueue}
				/>,
			);
		}).not.toThrow();

		expect(screen.getByRole("heading", { name: "Test Song" })).toBeTruthy();
	});
});
