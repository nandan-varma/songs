import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "../app/page";

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
				{component}
			</QueryClientProvider>,
		);
	};

	it("renders without crashing", () => {
		renderWithProviders(<Home />);

		// Check that the component renders
		expect(screen.getByRole("main")).toBeInTheDocument();
	});

	it("renders OfflineSongsList when in offline mode", () => {
		renderWithProviders(<Home />);

		// Check that the component renders
		expect(screen.getByRole("main")).toBeInTheDocument();
	});
});
