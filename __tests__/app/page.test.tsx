import type React from "react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { DownloadsProvider } from "@/contexts/downloads-context";
import { PlayerProvider } from "@/contexts/player-context";
import Home from "../../app/page";

// Mock Next.js router
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
}));

// Mock the contexts
jest.mock("@/contexts/offline-context", () => ({
	useOffline: jest.fn(),
}));

// Mock components
jest.mock("@/components/offline/offline-songs-list", () => ({
	OfflineSongsList: () => (
		<div data-testid="offline-songs-list">
			<p>Download songs from the search page to play them offline</p>
		</div>
	),
}));

jest.mock("@/components/search-content", () => ({
	SearchContent: () => <div data-testid="search-content">Search content</div>,
}));

jest.mock("@/components/error-boundary", () => ({
	ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}));

jest.mock("@/components/search-content", () => ({
	SearchContent: () => <div data-testid="search-content">Search content</div>,
}));

jest.mock("@/components/error-boundary", () => ({
	ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
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
	useDownloadsState: () => ({
		downloads: [],
		isDownloading: false,
		downloadSong: jest.fn(),
		removeDownload: jest.fn(),
		clearDownloads: jest.fn(),
	}),
}));

jest.mock("@/contexts/player-context", () => ({
	PlayerProvider: ({ children }: { children: React.ReactNode }) => children,
	usePlayerActions: () => ({
		playSong: jest.fn(),
		addToQueue: jest.fn(),
	}),
}));

describe("Home", () => {
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

	it("renders SearchContent when in online mode", () => {
		const { useOffline } = require("@/contexts/offline-context");
		useOffline.mockReturnValue({ isOfflineMode: false });

		renderWithProviders(<Home />);

		// Check that SearchContent is rendered (mocked component)
		expect(screen.getByTestId("search-content")).toBeTruthy();
	});

	it("renders OfflineSongsList when in offline mode", () => {
		const { useOffline } = require("@/contexts/offline-context");
		useOffline.mockReturnValue({ isOfflineMode: true });

		renderWithProviders(<Home />);

		// Check that the offline message is displayed
		expect(
			screen.getByText(
				"Download songs from the search page to play them offline",
			),
		).toBeTruthy();
	});

	it("renders with proper structure", () => {
		const { useOffline } = require("@/contexts/offline-context");
		useOffline.mockReturnValue({ isOfflineMode: false });

		renderWithProviders(<Home />);

		// Check that the main container has correct classes
		const container = screen.getByTestId("search-content").parentElement;
		expect(container?.className).toContain("min-h-screen");
		expect(container?.className).toContain("bg-background");
	});
});
