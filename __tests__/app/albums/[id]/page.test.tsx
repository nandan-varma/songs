import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AlbumPage from "@/app/albums/[id]/page";
import { DownloadsProvider } from "@/contexts/downloads-context";
import { PlayerProvider } from "@/contexts/player-context";

// Mock Next.js router and params
jest.mock("next/navigation", () => ({
	useRouter: () => ({
		push: jest.fn(),
		replace: jest.fn(),
		back: jest.fn(),
		forward: jest.fn(),
		refresh: jest.fn(),
		prefetch: jest.fn(),
	}),
	useSearchParams: () => new URLSearchParams(),
	usePathname: () => "/",
	useParams: () => ({ id: "1" }),
}));

// Mock contexts
jest.mock("@/contexts/offline-context", () => ({
	useOffline: jest.fn(() => ({
		getFilteredSongs: (songs: any[]) => songs,
		shouldEnableQuery: () => true,
		isOfflineMode: false,
	})),
}));

jest.mock("@/contexts/downloads-context", () => ({
	DownloadsProvider: ({ children }: { children: React.ReactNode }) => children,
	useDownloads: () => ({
		cachedSongs: new Map(),
		downloads: [],
		isDownloading: false,
		downloadSong: jest.fn(),
		removeDownload: jest.fn(),
		clearDownloads: jest.fn(),
		removeSong: jest.fn(),
	}),
}));

jest.mock("@/contexts/player-context", () => ({
	PlayerProvider: ({ children }: { children: React.ReactNode }) => children,
	usePlayerActions: () => ({
		playSong: jest.fn(),
		addToQueue: jest.fn(),
	}),
}));

// Mock hooks
jest.mock("@/hooks/queries", () => ({
	useAlbum: jest.fn(),
}));

jest.mock("@/hooks/use-offline-player", () => ({
	useOfflinePlayerActions: jest.fn(() => ({
		playQueue: jest.fn(),
		addToQueue: jest.fn(),
	})),
}));

// Mock components
jest.mock("@/components/error-boundary", () => ({
	ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}));

jest.mock("@/components/progressive-image", () => ({
	ProgressiveImage: ({ alt }: { alt: string }) => (
		<div data-testid="progressive-image">{alt}</div>
	),
}));

jest.mock("@/components/songs-list", () => ({
	SongsList: ({ songs }: { songs: any[] }) => (
		<div data-testid="songs-list">{songs.length} songs</div>
	),
}));

// Mock toast
jest.mock("sonner", () => ({
	toast: {
		success: jest.fn(),
	},
}));

const mockAlbum = {
	id: "1",
	name: "Test Album",
	artists: {
		primary: [{ id: "artist1", name: "Test Artist" }],
	},
	songs: [
		{
			id: "song1",
			name: "Song 1",
			duration: 180,
			album: { name: "Test Album" },
			artists: {
				primary: [{ name: "Test Artist" }],
				all: [{ name: "Test Artist" }],
			},
			image: [],
			url: "",
			type: "",
			description: "",
		},
		{
			id: "song2",
			name: "Song 2",
			duration: 200,
			album: { name: "Test Album" },
			artists: {
				primary: [{ name: "Test Artist" }],
				all: [{ name: "Test Artist" }],
			},
			image: [],
			url: "",
			type: "",
			description: "",
		},
	],
	image: ["image1.jpg"],
	year: 2023,
	language: "english",
	songCount: 2,
	description: "A test album",
};

describe("AlbumPage", () => {
	const createTestQueryClient = () =>
		new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});

	const renderWithProviders = (component: React.ReactElement) => {
		const queryClient = createTestQueryClient();
		return render(
			<QueryClientProvider client={queryClient}>
				<PlayerProvider>
					<DownloadsProvider>{component}</DownloadsProvider>
				</PlayerProvider>
			</QueryClientProvider>,
		);
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders loading state", () => {
		const { useAlbum } = require("@/hooks/queries");
		useAlbum.mockReturnValue({
			data: undefined,
			isLoading: true,
			error: null,
		});

		renderWithProviders(<AlbumPage />);

		expect(document.querySelector("svg.animate-spin")).toBeInTheDocument();
	});

	it("renders error state", async () => {
		const { useAlbum } = require("@/hooks/queries");
		useAlbum.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: new Error("Album not found"),
		});

		renderWithProviders(<AlbumPage />);

		await waitFor(() => {
			expect(screen.getByText("Album not found")).toBeInTheDocument();
		});
	});

	it("renders album details successfully", async () => {
		const { useAlbum } = require("@/hooks/queries");
		const { useOffline } = require("@/contexts/offline-context");
		useAlbum.mockReturnValue({
			data: mockAlbum,
			isLoading: false,
			error: null,
		});
		useOffline.mockReturnValue({
			getFilteredSongs: (songs: any[]) => songs,
			shouldEnableQuery: () => true,
			isOfflineMode: false,
		});

		const { container } = renderWithProviders(<AlbumPage />);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { level: 1, name: "Test Album" }),
			).toBeTruthy();
		});

		expect(screen.getByText("Album")).toBeTruthy();
		expect(screen.getByText("Test Artist")).toBeTruthy();
		expect(screen.getByText("2023")).toBeTruthy();
		expect(screen.getByText("english")).toBeTruthy();
		expect(screen.getByText("A test album")).toBeTruthy();
		expect(screen.getByTestId("progressive-image")).toBeTruthy();
		expect(screen.getByTestId("songs-list")).toBeTruthy();

		// Snapshot test
		expect(container.firstChild).toMatchSnapshot();
	});

	it("renders offline mode message", () => {
		const { useOffline } = require("@/contexts/offline-context");
		useOffline.mockReturnValue({
			getFilteredSongs: () => [],
			shouldEnableQuery: () => false,
			isOfflineMode: true,
		});

		renderWithProviders(<AlbumPage />);

		expect(
			screen.getByText(/Album details are not available in offline mode/),
		).toBeInTheDocument();
	});

	it("handles play all button click", async () => {
		const { useAlbum } = require("@/hooks/queries");
		const { useOffline } = require("@/contexts/offline-context");
		const { useOfflinePlayerActions } = require("@/hooks/use-offline-player");
		const { toast } = require("sonner");

		useAlbum.mockReturnValue({
			data: mockAlbum,
			isLoading: false,
			error: null,
		});
		useOffline.mockReturnValue({
			getFilteredSongs: (songs: any[]) => songs,
			shouldEnableQuery: () => true,
			isOfflineMode: false,
		});

		const mockPlayQueue = jest.fn();
		useOfflinePlayerActions.mockReturnValue({
			playQueue: mockPlayQueue,
			addToQueue: jest.fn(),
		});

		const user = userEvent.setup();
		renderWithProviders(<AlbumPage />);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { level: 1, name: "Test Album" }),
			).toBeInTheDocument();
		});

		const playButton = screen.getByRole("button", { name: /play all/i });
		await user.click(playButton);

		expect(mockPlayQueue).toHaveBeenCalledWith(mockAlbum.songs);
		expect(toast.success).toHaveBeenCalledWith("Playing Test Album");
	});

	it("handles add all to queue button click", async () => {
		const { useAlbum } = require("@/hooks/queries");
		const { useOffline } = require("@/contexts/offline-context");
		const { useOfflinePlayerActions } = require("@/hooks/use-offline-player");
		const { toast } = require("sonner");

		useAlbum.mockReturnValue({
			data: mockAlbum,
			isLoading: false,
			error: null,
		});
		useOffline.mockReturnValue({
			getFilteredSongs: (songs: any[]) => songs,
			shouldEnableQuery: () => true,
			isOfflineMode: false,
		});

		const mockAddToQueue = jest.fn();
		useOfflinePlayerActions.mockReturnValue({
			playQueue: jest.fn(),
			addToQueue: mockAddToQueue,
		});

		const user = userEvent.setup();
		renderWithProviders(<AlbumPage />);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { level: 1, name: "Test Album" }),
			).toBeInTheDocument();
		});

		const addButton = screen.getByRole("button", { name: /add all to queue/i });
		await user.click(addButton);

		expect(mockAddToQueue).toHaveBeenCalledTimes(2); // Two songs
		expect(toast.success).toHaveBeenCalledWith("Added 2 songs to queue");
	});

	it("disables buttons when no songs available", async () => {
		const { useAlbum } = require("@/hooks/queries");
		const { useOffline } = require("@/contexts/offline-context");

		useOffline.mockReturnValue({
			getFilteredSongs: () => [], // No songs after filtering
			shouldEnableQuery: () => true,
			isOfflineMode: false,
		});

		useAlbum.mockReturnValue({
			data: { ...mockAlbum, songs: [] },
			isLoading: false,
			error: null,
		});

		renderWithProviders(<AlbumPage />);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { level: 1, name: "Test Album" }),
			).toBeInTheDocument();
		});

		const playButton = screen.getByRole("button", { name: /play all/i });
		const addButton = screen.getByRole("button", { name: /add all to queue/i });

		expect(playButton.hasAttribute("disabled")).toBe(true);
		expect(addButton.hasAttribute("disabled")).toBe(true);
	});
});
