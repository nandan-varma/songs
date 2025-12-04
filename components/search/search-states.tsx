"use client";

import { memo } from "react";

interface EmptyStateProps {
	query: string;
	message?: string;
}

export const EmptyState = memo(function EmptyState({
	query,
	message,
}: EmptyStateProps) {
	return (
		<div className="text-center text-muted-foreground py-12">
			{message || `No results found for "${query}"`}
		</div>
	);
});

export const LoadingSpinner = memo(function LoadingSpinner() {
	return (
		<div className="flex justify-center py-12">
			<div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
		</div>
	);
});

interface ErrorStateProps {
	message?: string;
}

export const ErrorState = memo(function ErrorState({
	message,
}: ErrorStateProps) {
	return (
		<div className="text-center text-destructive py-8">
			{message || "Failed to load search results. Please try again."}
		</div>
	);
});
