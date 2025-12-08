import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "../../components/error-boundary";

// Mock console methods
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

describe("ErrorBoundary", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		consoleErrorSpy.mockClear();
		consoleLogSpy.mockClear();
	});

	// Component that throws an error
	const ErrorComponent = ({
		shouldThrow = true,
	}: {
		shouldThrow?: boolean;
	}) => {
		if (shouldThrow) {
			throw new Error("Test error");
		}
		return <div>No error</div>;
	};

	// Component that throws a network error
	const NetworkErrorComponent = () => {
		throw new Error("Failed to fetch");
	};

	it("renders children when no error occurs", () => {
		render(
			<ErrorBoundary>
				<div>Normal content</div>
			</ErrorBoundary>,
		);

		expect(screen.getByText("Normal content")).toBeTruthy();
	});

	it("catches and displays errors with default UI", () => {
		render(
			<ErrorBoundary>
				<ErrorComponent />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Something went wrong")).toBeTruthy();
		expect(screen.getByText("Test error")).toBeTruthy();
		expect(screen.getByRole("button", { name: /try again/i })).toBeTruthy();
	});

	it("logs errors with context", () => {
		render(
			<ErrorBoundary context="TestComponent">
				<ErrorComponent />
			</ErrorBoundary>,
		);

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"[ErrorBoundary:TestComponent] Caught error:",
			expect.objectContaining({
				error: expect.any(Error),
				errorInfo: expect.any(Object),
				componentStack: expect.any(String),
				retryCount: 0,
			}),
		);
	});

	it("displays contextual error messages for network errors", () => {
		render(
			<ErrorBoundary>
				<NetworkErrorComponent />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Connection Error")).toBeTruthy();
		expect(screen.getByText(/Unable to connect to the server/)).toBeTruthy();
	});

	it("calls onError callback when provided", () => {
		const onErrorMock = jest.fn();

		render(
			<ErrorBoundary onError={onErrorMock}>
				<ErrorComponent />
			</ErrorBoundary>,
		);

		expect(onErrorMock).toHaveBeenCalledWith(
			expect.any(Error),
			expect.any(Object),
		);
	});

	it("auto-resets when resetKeys change", () => {
		let resetKey = "initial";

		const { rerender } = render(
			<ErrorBoundary resetKeys={[resetKey]}>
				<ErrorComponent />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Something went wrong")).toBeTruthy();

		resetKey = "changed";

		rerender(
			<ErrorBoundary resetKeys={[resetKey]}>
				<div>Recovered</div>
			</ErrorBoundary>,
		);

		expect(screen.getByText("Recovered")).toBeTruthy();
	});

	it("uses custom fallback component", () => {
		const CustomFallback = ({ error, resetError, retryCount }: any) => (
			<div data-testid="custom-fallback">
				Custom: {error?.message} (retry: {retryCount})
				<button onClick={resetError}>Reset</button>
			</div>
		);

		render(
			<ErrorBoundary fallback={CustomFallback}>
				<ErrorComponent />
			</ErrorBoundary>,
		);

		expect(screen.getByTestId("custom-fallback")).toBeTruthy();
		expect(screen.getByText("Custom: Test error (retry: 0)")).toBeTruthy();
	});
});
