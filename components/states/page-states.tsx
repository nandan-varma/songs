"use client";

import { AlertCircle, Loader2, WifiOff } from "lucide-react";
import { memo, type ReactNode } from "react";

/**
 * Generic page state renderer
 * Handles loading, error, empty, and offline states
 * Reduces boilerplate across pages
 */

interface PageStatesProps<T> {
	/** Current data state */
	data: T | undefined | null;
	/** Is data loading */
	isLoading: boolean;
	/** Is data pending */
	isPending?: boolean;
	/** Error message if any */
	error: Error | null;
	/** Is offline mode */
	isOffline?: boolean;
	/** Custom loading component */
	loadingComponent?: ReactNode;
	/** Custom error component */
	errorComponent?: ReactNode;
	/** Custom empty component */
	emptyComponent?: ReactNode;
	/** Custom offline component */
	offlineComponent?: ReactNode;
	/** Content renderer when data is ready */
	children: (data: T) => ReactNode;
}

const DefaultLoadingState = memo(function DefaultLoadingState() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
			<Loader2 className="h-8 w-8 animate-spin text-primary" />
			<p className="text-muted-foreground">Loading...</p>
		</div>
	);
});

const DefaultErrorState = memo(function DefaultErrorState({
	error,
}: {
	error: Error | null;
}) {
	return (
		<div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-destructive">
			<AlertCircle className="h-8 w-8" />
			<div className="text-center">
				<p className="font-semibold">Error loading content</p>
				<p className="text-sm text-muted-foreground">{error?.message}</p>
			</div>
		</div>
	);
});

const DefaultEmptyState = memo(function DefaultEmptyState() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-muted-foreground">
			<p className="text-lg">No content available</p>
		</div>
	);
});

const DefaultOfflineState = memo(function DefaultOfflineState() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-muted-foreground">
			<WifiOff className="h-8 w-8" />
			<div className="text-center">
				<p className="font-semibold">Offline Mode</p>
				<p className="text-sm">You're offline. Check your connection.</p>
			</div>
		</div>
	);
});

/**
 * Generic page state component
 * Automatically renders appropriate state based on data, loading, error status
 * Supports customization of each state renderer
 */
export const PageStates = memo(function PageStates<T>({
	data,
	isLoading,
	isPending = false,
	error,
	isOffline = false,
	loadingComponent,
	errorComponent,
	emptyComponent,
	offlineComponent,
	children,
}: PageStatesProps<T>) {
	const isLoadingState = isLoading || isPending;

	// Loading state
	if (isLoadingState) {
		return loadingComponent ?? <DefaultLoadingState />;
	}

	// Offline state
	if (isOffline && !data) {
		return offlineComponent ?? <DefaultOfflineState />;
	}

	// Error state
	if (error) {
		return errorComponent ?? <DefaultErrorState error={error} />;
	}

	// Empty state
	if (!data) {
		return emptyComponent ?? <DefaultEmptyState />;
	}

	// Success state - render children with data
	return <>{children(data)}</>;
});

PageStates.displayName = "PageStates";
