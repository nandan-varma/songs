import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "../../app/page";
import { DownloadsProvider } from "@/contexts/downloads-context";
import { PlayerProvider } from "@/contexts/player-context";

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
	useOffline: () => ({ isOfflineMode: true }),
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

	it("renders without crashing", () => {
		renderWithProviders(<Home />);

		// Check that the component renders the offline message
		expect(screen.getByText("No offline songs available")).toBeInTheDocument();
	});

	it("renders OfflineSongsList when in offline mode", () => {
		renderWithProviders(<Home />);

		// Check that the offline message is displayed
		expect(
			screen.getByText(
				"Download songs from the search page to play them offline",
			),
		).toBeInTheDocument();
	});
});
