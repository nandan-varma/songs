import { renderHook, act } from "@testing-library/react";
import { usePWAInstall } from "../../hooks/use-pwa-install";

describe("usePWAInstall", () => {
	beforeEach(() => {
		// Reset window mocks
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: jest.fn().mockImplementation((query) => ({
				matches: false,
				media: query,
				onchange: null,
				addListener: jest.fn(),
				removeListener: jest.fn(),
				addEventListener: jest.fn(),
				removeEventListener: jest.fn(),
				dispatchEvent: jest.fn(),
			})),
		});

		// Clear event listeners
		jest.clearAllMocks();
	});

	it("detects when app is already installed", () => {
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: jest.fn().mockImplementation(() => ({
				matches: true, // display-mode: standalone
			})),
		});

		const { result } = renderHook(() => usePWAInstall());

		expect(result.current.isInstalled).toBe(true);
		expect(result.current.isInstallable).toBe(false);
	});

	it("detects installable prompt", () => {
		const mockPrompt = {
			prompt: jest.fn(),
			userChoice: Promise.resolve({ outcome: "accepted" }),
		};

		const { result } = renderHook(() => usePWAInstall());

		act(() => {
			window.dispatchEvent(
				new CustomEvent("beforeinstallprompt", { detail: mockPrompt }),
			);
		});

		expect(result.current.isInstallable).toBe(true);
		expect(result.current.isInstalled).toBe(false);
	});

	it("handles app installed event", () => {
		const { result } = renderHook(() => usePWAInstall());

		act(() => {
			window.dispatchEvent(new Event("appinstalled"));
		});

		expect(result.current.isInstalled).toBe(true);
		expect(result.current.isInstallable).toBe(false);
	});

	it("promptInstall returns false when no deferred prompt", async () => {
		const { result } = renderHook(() => usePWAInstall());

		const success = await result.current.promptInstall();

		expect(success).toBe(false);
	});

	it("promptInstall succeeds when user accepts", async () => {
		const mockPrompt = {
			prompt: jest.fn(),
			userChoice: Promise.resolve({ outcome: "accepted" }),
		};

		const { result } = renderHook(() => usePWAInstall());

		act(() => {
			window.dispatchEvent(
				new CustomEvent("beforeinstallprompt", { detail: mockPrompt }),
			);
		});

		let success;
		await act(async () => {
			success = await result.current.promptInstall();
		});

		expect(success).toBe(true);
		expect(result.current.isInstallable).toBe(false);
	});

	it("promptInstall fails when user dismisses", async () => {
		const mockPrompt = {
			prompt: jest.fn(),
			userChoice: Promise.resolve({ outcome: "dismissed" }),
		};

		const { result } = renderHook(() => usePWAInstall());

		act(() => {
			window.dispatchEvent(
				new CustomEvent("beforeinstallprompt", { detail: mockPrompt }),
			);
		});

		let success;
		await act(async () => {
			success = await result.current.promptInstall();
		});

		expect(success).toBe(false);
	});
});
