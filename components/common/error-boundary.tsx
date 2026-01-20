"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
	errorInfo?: React.ErrorInfo;
	retryCount: number;
}

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ComponentType<{
		error?: Error;
		resetError: () => void;
		retryCount: number;
	}>;
	// Context name for better error messages
	context?: string;
	// Function to call when error occurs (e.g., for logging)
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
	// Maximum auto-retry attempts for transient errors
	maxRetries?: number;
	// Keys that trigger automatic reset when changed
	resetKeys?: Array<string | number>;
}

export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			retryCount: 0,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		const context = this.props.context || "Component";

		// Log error with context
		console.error(`[ErrorBoundary:${context}] Caught error:`, {
			error,
			errorInfo,
			componentStack: errorInfo.componentStack,
			retryCount: this.state.retryCount,
		});

		// Store error info for display
		this.setState({ errorInfo });

		// Call custom error handler if provided
		if (this.props.onError) {
			try {
				this.props.onError(error, errorInfo);
			} catch (handlerError) {
				console.error("Error in onError handler:", handlerError);
			}
		}

		// TODO: Send to error reporting service (Sentry, LogRocket, etc.)
		// if (typeof window !== 'undefined' && window.errorReporter) {
		//   window.errorReporter.captureException(error, { context, errorInfo });
		// }
	}

	componentDidUpdate(prevProps: ErrorBoundaryProps) {
		// Auto-reset if resetKeys change
		if (this.state.hasError && this.props.resetKeys) {
			const prevKeys = prevProps.resetKeys || [];
			const currentKeys = this.props.resetKeys || [];

			const keysChanged = currentKeys.some(
				(key, index) => key !== prevKeys[index],
			);

			if (keysChanged) {
				console.log(
					`[ErrorBoundary:${this.props.context}] Reset keys changed, auto-resetting`,
				);
				this.resetError();
			}
		}
	}

	resetError = () => {
		const newRetryCount = this.state.retryCount + 1;
		const maxRetries = this.props.maxRetries || 3;

		console.log(
			`[ErrorBoundary:${this.props.context}] Resetting error (attempt ${newRetryCount}/${maxRetries})`,
		);

		this.setState({
			hasError: false,
			error: undefined,
			errorInfo: undefined,
			retryCount: newRetryCount,
		});
	};

	getContextualMessage(): {
		title: string;
		message: string;
		canRetry: boolean;
	} {
		const error = this.state.error;
		const context = this.props.context;
		const errorMessage = error?.message || "";

		// Network errors
		if (
			errorMessage.includes("fetch") ||
			errorMessage.includes("network") ||
			errorMessage.includes("Failed to fetch")
		) {
			return {
				title: "Connection Error",
				message:
					"Unable to connect to the server. Please check your internet connection and try again.",
				canRetry: true,
			};
		}

		// Storage/IndexedDB errors
		if (
			errorMessage.includes("QuotaExceededError") ||
			errorMessage.includes("storage")
		) {
			return {
				title: "Storage Error",
				message:
					"Your device storage is full. Please free up some space and try again.",
				canRetry: false,
			};
		}

		// Audio playback errors
		if (
			context === "AudioPlayer" ||
			errorMessage.includes("audio") ||
			errorMessage.includes("media")
		) {
			return {
				title: "Playback Error",
				message:
					"Unable to play this song. The file may be corrupted or in an unsupported format.",
				canRetry: true,
			};
		}

		// Search/API errors
		if (context === "Search" || context === "SearchContent") {
			return {
				title: "Search Error",
				message: "Unable to load search results. Please try again.",
				canRetry: true,
			};
		}

		// Downloads errors
		if (context === "Downloads" || context === "DownloadsProvider") {
			return {
				title: "Download Error",
				message:
					"Unable to manage downloads. Please try again or clear your downloads.",
				canRetry: true,
			};
		}

		// Context provider errors
		if (context?.includes("Provider")) {
			return {
				title: `${context.replace("Provider", "")} Error`,
				message:
					"A critical component failed to load. Try refreshing the page.",
				canRetry: true,
			};
		}

		// Generic fallback
		return {
			title: "Something went wrong",
			message:
				errorMessage || "An unexpected error occurred. Please try again.",
			canRetry: true,
		};
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				const FallbackComponent = this.props.fallback;
				return (
					<FallbackComponent
						error={this.state.error}
						resetError={this.resetError}
						retryCount={this.state.retryCount}
					/>
				);
			}

			const { title, message, canRetry } = this.getContextualMessage();
			const maxRetries = this.props.maxRetries || 3;
			const hasRetriesLeft = this.state.retryCount < maxRetries;

			return (
				<div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
					<AlertTriangle className="h-12 w-12 text-destructive mb-4" />
					<h2 className="text-xl font-semibold mb-2">{title}</h2>
					<p className="text-muted-foreground mb-4 max-w-md">{message}</p>

					{process.env.NODE_ENV === "development" && this.state.error && (
						<details className="mb-4 text-left max-w-2xl w-full">
							<summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
								Error Details (Development Only)
							</summary>
							<pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-auto">
								{this.state.error.stack}
							</pre>
						</details>
					)}

					<div className="flex gap-2">
						{canRetry && hasRetriesLeft && (
							<Button onClick={this.resetError} variant="outline">
								<RefreshCw className="h-4 w-4 mr-2" />
								Try again
								{this.state.retryCount > 0 &&
									` (${this.state.retryCount}/${maxRetries})`}
							</Button>
						)}
						{(!canRetry || !hasRetriesLeft) && (
							<Button
								onClick={() => window.location.reload()}
								variant="outline"
							>
								<RefreshCw className="h-4 w-4 mr-2" />
								Refresh Page
							</Button>
						)}
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

// Hook version for functional components
export function useErrorHandler() {
	return (error: Error) => {
		console.error("Error caught by hook:", error);
		// In a real app, you might send to error reporting service
	};
}
