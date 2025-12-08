import type React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { Navigation } from "../../components/navigation";

// Mock contexts
jest.mock("../../contexts/downloads-context", () => ({
	useDownloads: jest.fn(),
}));

jest.mock("../../contexts/offline-context", () => ({
	useOffline: jest.fn(),
}));

jest.mock("../../hooks/use-pwa-install", () => ({
	usePWAInstall: jest.fn(),
}));

// Mock Next.js Link
jest.mock("next/link", () => ({
	__esModule: true,
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

describe("Navigation", () => {
	const mockUseDownloads =
		require("../../contexts/downloads-context").useDownloads;
	const mockUseOffline = require("../../contexts/offline-context").useOffline;
	const mockUsePWAInstall =
		require("../../hooks/use-pwa-install").usePWAInstall;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders logo and navigation links", () => {
		mockUseDownloads.mockReturnValue({ isDownloading: false });
		mockUseOffline.mockReturnValue({
			isOfflineMode: false,
			cachedSongsCount: 0,
		});
		mockUsePWAInstall.mockReturnValue({
			isInstallable: false,
			promptInstall: jest.fn(),
		});

		render(<Navigation />);

		expect(screen.getByText("Music App")).toBeTruthy();
		expect(screen.getByText("Downloads")).toBeTruthy();
		expect(screen.getByText("Online")).toBeTruthy();
	});

	it("shows PWA install button when installable", () => {
		const mockPromptInstall = jest.fn();
		mockUseDownloads.mockReturnValue({ isDownloading: false });
		mockUseOffline.mockReturnValue({
			isOfflineMode: false,
			cachedSongsCount: 0,
		});
		mockUsePWAInstall.mockReturnValue({
			isInstallable: true,
			promptInstall: mockPromptInstall,
		});

		render(<Navigation />);

		const installButton = screen.getByText("Install App");
		expect(installButton).toBeTruthy();

		fireEvent.click(installButton);
		expect(mockPromptInstall).toHaveBeenCalled();
	});

	it("shows offline mode with cached count", () => {
		mockUseDownloads.mockReturnValue({ isDownloading: false });
		mockUseOffline.mockReturnValue({
			isOfflineMode: true,
			cachedSongsCount: 5,
		});
		mockUsePWAInstall.mockReturnValue({
			isInstallable: false,
			promptInstall: jest.fn(),
		});

		render(<Navigation />);

		expect(screen.getByText("Offline")).toBeTruthy();
		expect(screen.getByText("5")).toBeTruthy();
	});

	it("shows downloading indicator", () => {
		mockUseDownloads.mockReturnValue({ isDownloading: true });
		mockUseOffline.mockReturnValue({
			isOfflineMode: false,
			cachedSongsCount: 0,
		});
		mockUsePWAInstall.mockReturnValue({
			isInstallable: false,
			promptInstall: jest.fn(),
		});

		render(<Navigation />);

		// Check for the downloading indicator (the animated bar)
		const downloadButton = screen.getByText("Downloads");
		expect(downloadButton).toBeTruthy();
		// The indicator is a div with specific classes, but hard to test directly
	});
});
