import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlbumsList } from "../../components/albums-list";
import type { Album, AlbumSearchResult } from "../../lib/types";

// Mock Next.js components
jest.mock("next/link", () => ({
	__esModule: true,
	default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
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

// Mock Lucide icons
jest.mock("lucide-react", () => ({
	Disc3: () => <div data-testid="disc3-icon">Disc3</div>,
}));

const mockAlbum: Album = {
	id: "album1",
	title: "Test Album",
	artist: "Test Artist",
	image: [{ quality: "500x500", url: "cover.jpg" }],
	year: "2023",
	language: "english",
	songIds: "song1,song2",
	description: "A test album",
	url: "album-url",
	type: "album",
};

const mockAlbumSearchResult: AlbumSearchResult = {
	id: "album2",
	name: "Search Album",
	description: "A search result album",
	playCount: 1000,
	explicitContent: false,
	artists: {
		primary: [
			{
				id: "artist1",
				name: "Search Artist 1",
				role: "primary" as const,
				type: "artist" as const,
				image: [],
				url: "artist-url",
			},
			{
				id: "artist2",
				name: "Search Artist 2",
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
				name: "Search Artist 1",
				role: "primary" as const,
				type: "artist" as const,
				image: [],
				url: "artist-url",
			},
		],
	},
	image: [{ quality: "500x500", url: "search-cover.jpg" }],
	year: 2024,
	language: "hindi",
	type: "album",
	url: "album-url",
};

const mockAlbumWithoutImage: Album = {
	...mockAlbum,
	image: [],
};

describe("AlbumsList", () => {
	const mockUseRouter = require("next/navigation").useRouter;

	beforeEach(() => {
		jest.clearAllMocks();
		mockUseRouter.mockReturnValue({
			push: jest.fn(),
		});
	});

	it("renders nothing when albums array is empty", () => {
		const { container } = render(<AlbumsList albums={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it("renders albums list with header", () => {
		render(<AlbumsList albums={[mockAlbum]} />);

		expect(screen.getByText("Albums")).toBeTruthy();
		expect(screen.getByText("Test Album")).toBeTruthy();
		expect(screen.getByText("Test Artist")).toBeTruthy();
		expect(screen.getByText("2023 · english")).toBeTruthy();
	});

	it("renders Album type correctly", () => {
		render(<AlbumsList albums={[mockAlbum]} />);

		expect(screen.getByText("Test Album")).toBeTruthy();
		expect(screen.getByText("Test Artist")).toBeTruthy();
		expect(screen.getByText("2023 · english")).toBeTruthy();
		expect(screen.getByTestId("progressive-image")).toBeTruthy();
	});

	it("renders AlbumSearchResult type correctly", () => {
		render(<AlbumsList albums={[mockAlbumSearchResult]} />);

		expect(screen.getByText("Search Album")).toBeTruthy();
		expect(screen.getByText("Search Artist 1")).toBeTruthy();
		expect(screen.getByText("Search Artist 2")).toBeTruthy();
		expect(screen.getByText("2024 · hindi")).toBeTruthy();
	});

	it("renders fallback icon when no image is provided", () => {
		render(<AlbumsList albums={[mockAlbumWithoutImage]} />);

		expect(screen.getByTestId("disc3-icon")).toBeTruthy();
	});

	it("links to album detail page", () => {
		render(<AlbumsList albums={[mockAlbum]} />);

		const link = screen.getByRole("link", { name: /test album/i });
		expect(link.getAttribute("href")).toBe("/albums/album1");
	});

	it("handles artist click navigation for AlbumSearchResult", async () => {
		const user = userEvent.setup();
		const mockPush = jest.fn();
		mockUseRouter.mockReturnValue({
			push: mockPush,
		});

		render(<AlbumsList albums={[mockAlbumSearchResult]} />);

		const artistButton = screen.getByRole("button", {
			name: "Search Artist 1",
		});
		await user.click(artistButton);

		expect(mockPush).toHaveBeenCalledWith("/artists/artist1");
	});

	it("prevents event propagation on artist button click", async () => {
		const user = userEvent.setup();
		const mockPush = jest.fn();
		mockUseRouter.mockReturnValue({
			push: mockPush,
		});

		// Mock parent click handler
		const mockParentClick = jest.fn();
		const { container } = render(
			<div onClick={mockParentClick}>
				<AlbumsList albums={[mockAlbumSearchResult]} />
			</div>,
		);

		const artistButton = screen.getByRole("button", {
			name: "Search Artist 1",
		});
		await user.click(artistButton);

		expect(mockParentClick).not.toHaveBeenCalled();
		expect(mockPush).toHaveBeenCalledWith("/artists/artist1");
	});

	it("renders multiple albums in grid layout", () => {
		render(<AlbumsList albums={[mockAlbum, mockAlbumSearchResult]} />);

		expect(screen.getByText("Test Album")).toBeTruthy();
		expect(screen.getByText("Search Album")).toBeTruthy();
		expect(screen.getAllByTestId("card")).toHaveLength(2);
	});

	it("applies hover styles to cards", () => {
		render(<AlbumsList albums={[mockAlbum]} />);

		const card = screen.getByTestId("card");
		expect(card.className).toContain("hover:bg-accent/50");
	});

	it("handles albums with missing artist information", () => {
		const albumWithoutArtist: Album = {
			...mockAlbum,
			artist: "",
		};

		render(<AlbumsList albums={[albumWithoutArtist]} />);

		expect(screen.getByText("Test Album")).toBeTruthy();
		// Should handle empty artist gracefully
		expect(screen.getByText("", { selector: "p" })).toBeTruthy();
	});

	it("handles AlbumSearchResult with missing artists", () => {
		const albumWithoutArtists: AlbumSearchResult = {
			...mockAlbumSearchResult,
			artists: undefined as any,
		};

		expect(() => {
			render(<AlbumsList albums={[albumWithoutArtists]} />);
		}).not.toThrow();

		// Should still render the album even with missing artists
		expect(screen.getByText("2024 · hindi")).toBeTruthy();
	});

	it("renders responsive grid classes", () => {
		render(<AlbumsList albums={[mockAlbum]} />);

		const gridContainer = screen.getByText("Albums").nextElementSibling;
		expect(gridContainer?.className).toContain("grid");
		expect(gridContainer?.className).toContain("sm:grid-cols-2");
		expect(gridContainer?.className).toContain("lg:grid-cols-3");
		expect(gridContainer?.className).toContain("xl:grid-cols-4");
	});

	it("renders year and language information", () => {
		render(<AlbumsList albums={[mockAlbum, mockAlbumSearchResult]} />);

		expect(screen.getByText("2023 · english")).toBeTruthy();
		expect(screen.getByText("2024 · hindi")).toBeTruthy();
	});

	it("handles mixed Album and AlbumSearchResult types", () => {
		render(<AlbumsList albums={[mockAlbum, mockAlbumSearchResult]} />);

		expect(screen.getByText("Test Album")).toBeTruthy();
		expect(screen.getByText("Search Album")).toBeTruthy();
		expect(screen.getByText("Test Artist")).toBeTruthy();
		expect(screen.getByText("Search Artist 1")).toBeTruthy();
		expect(screen.getByText("Search Artist 2")).toBeTruthy();
	});
});
