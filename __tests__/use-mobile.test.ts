import { renderHook } from "@testing-library/react";
import { useIsMobile } from "../hooks/use-mobile";

describe("useIsMobile", () => {
	beforeEach(() => {
		// Reset window dimensions
		Object.defineProperty(window, "innerWidth", {
			writable: true,
			configurable: true,
			value: 1024,
		});

		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: jest.fn().mockImplementation((query) => ({
				matches: false,
				media: query,
				onchange: null,
				addListener: jest.fn(), // deprecated
				removeListener: jest.fn(), // deprecated
				addEventListener: jest.fn(),
				removeEventListener: jest.fn(),
				dispatchEvent: jest.fn(),
			})),
		});
	});

	it("returns false for desktop width", () => {
		window.innerWidth = 1024;

		const { result } = renderHook(() => useIsMobile());

		expect(result.current).toBe(false);
	});

	it("returns true for mobile width", () => {
		window.innerWidth = 767;

		const { result } = renderHook(() => useIsMobile());

		expect(result.current).toBe(true);
	});

	it("initializes correctly based on window width", () => {
		// Test desktop width
		Object.defineProperty(window, "innerWidth", {
			writable: true,
			configurable: true,
			value: 1024,
		});

		const { result: desktopResult } = renderHook(() => useIsMobile());
		expect(desktopResult.current).toBe(false);

		// Test mobile width
		Object.defineProperty(window, "innerWidth", {
			writable: true,
			configurable: true,
			value: 767,
		});

		const { result: mobileResult } = renderHook(() => useIsMobile());
		expect(mobileResult.current).toBe(true);
	});
});
