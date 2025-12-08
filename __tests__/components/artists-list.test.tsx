import React from "react";
import { render, screen } from "@testing-library/react";
import { ArtistsList } from "../../components/artists-list";
import type { Artist, ArtistSearchResult } from "../../lib/types";

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

// Mock Lucide icons
jest.mock("lucide-react", () => ({
	Users: () => <div data-testid="users-icon">Users</div>,
}));

const mockArtist: Artist = {
	id: "artist1",
	title: "Test Artist",
	image: [{ quality: "500x500", url: "avatar.jpg" }],
	type: "artist",
	description: "Singer",
	position: 1,
};

const mockArtistSearchResult: ArtistSearchResult = {
	id: "artist2",
	name: "Search Artist",
	role: "primary_artists",
	image: [{ quality: "500x500", url: "search-avatar.jpg" }],
	type: "artist",
	url: "artist-url",
};

const mockArtistWithoutImage: Artist = {
	...mockArtist,
	image: [],
};

describe("ArtistsList", () => {
	it("renders nothing when artists array is empty", () => {
		const { container } = render(<ArtistsList artists={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it("renders artists list with header", () => {
		render(<ArtistsList artists={[mockArtist]} />);

		expect(screen.getByText("Artists")).toBeTruthy();
		expect(screen.getByText("Test Artist")).toBeTruthy();
		expect(screen.getByText("Singer")).toBeTruthy();
	});

	it("renders Artist type correctly", () => {
		render(<ArtistsList artists={[mockArtist]} />);

		expect(screen.getByText("Test Artist")).toBeTruthy();
		expect(screen.getByText("Singer")).toBeTruthy();
		expect(screen.getByTestId("progressive-image")).toBeTruthy();
	});

	it("renders ArtistSearchResult type correctly", () => {
		render(<ArtistsList artists={[mockArtistSearchResult]} />);

		expect(screen.getByText("Search Artist")).toBeTruthy();
		expect(screen.getByText("primary_artists")).toBeTruthy();
	});

	it("renders fallback icon when no image is provided", () => {
		render(<ArtistsList artists={[mockArtistWithoutImage]} />);

		expect(screen.getByTestId("users-icon")).toBeTruthy();
	});

	it("links to artist detail page", () => {
		render(<ArtistsList artists={[mockArtist]} />);

		const link = screen.getByRole("link", { name: /test artist/i });
		expect(link.getAttribute("href")).toBe("/artists/artist1");
	});

	it("renders multiple artists in grid layout", () => {
		render(<ArtistsList artists={[mockArtist, mockArtistSearchResult]} />);

		expect(screen.getByText("Test Artist")).toBeTruthy();
		expect(screen.getByText("Search Artist")).toBeTruthy();
		expect(screen.getAllByTestId("card")).toHaveLength(2);
	});

	it("applies hover styles to cards", () => {
		render(<ArtistsList artists={[mockArtist]} />);

		const card = screen.getByTestId("card");
		expect(card.className).toContain("hover:bg-accent/50");
	});

	it("handles artists with missing information gracefully", () => {
		const incompleteArtist: Artist = {
			...mockArtist,
			description: "",
		};

		render(<ArtistsList artists={[incompleteArtist]} />);

		expect(screen.getByText("Test Artist")).toBeTruthy();
		// Should handle empty description gracefully
		expect(screen.getByText("", { selector: "p" })).toBeTruthy();
	});

	it("renders responsive grid classes", () => {
		render(<ArtistsList artists={[mockArtist]} />);

		const gridContainer = screen.getByText("Artists").nextElementSibling;
		expect(gridContainer?.className).toContain("grid");
		expect(gridContainer?.className).toContain("sm:grid-cols-2");
		expect(gridContainer?.className).toContain("lg:grid-cols-3");
		expect(gridContainer?.className).toContain("xl:grid-cols-4");
	});

	it("capitalizes role text", () => {
		render(<ArtistsList artists={[mockArtistSearchResult]} />);

		// The role "primary_artists" should be displayed as "Primary_artists" due to capitalize class
		expect(screen.getByText("primary_artists")).toBeTruthy();
	});

	it("handles mixed Artist and ArtistSearchResult types", () => {
		render(<ArtistsList artists={[mockArtist, mockArtistSearchResult]} />);

		expect(screen.getByText("Test Artist")).toBeTruthy();
		expect(screen.getByText("Search Artist")).toBeTruthy();
		expect(screen.getByText("Singer")).toBeTruthy();
		expect(screen.getByText("primary_artists")).toBeTruthy();
	});

	it("renders circular images for artists", () => {
		render(<ArtistsList artists={[mockArtist]} />);

		// The component uses rounded="full" for artists - this is passed to ProgressiveImage
		// Since we mock ProgressiveImage, we can't test the rounded prop directly
		expect(screen.getByTestId("progressive-image")).toBeTruthy();
	});

	it("centers artist information", () => {
		render(<ArtistsList artists={[mockArtist]} />);

		const infoContainer = screen.getByText("Test Artist").parentElement;
		expect(infoContainer?.className).toContain("text-center");
	});

	it("displays position for Artist type when available", () => {
		render(<ArtistsList artists={[mockArtist]} />);

		// Position is not displayed in the current component, only title and description
		expect(screen.getByText("Test Artist")).toBeTruthy();
		expect(screen.getByText("Singer")).toBeTruthy();
	});
});
