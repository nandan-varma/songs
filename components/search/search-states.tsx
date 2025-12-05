"use client";

import { memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, WifiOff } from "lucide-react";

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

export const OfflineEmptyState = memo(function OfflineEmptyState({
	query,
	type = "content",
}: {
	query?: string;
	type?: "content" | "search";
}) {
	return (
		<div className="text-center py-12 space-y-4">
			<div className="flex justify-center">
				<WifiOff className="h-12 w-12 text-muted-foreground" />
			</div>
			<div>
				<h3 className="font-semibold text-lg mb-2">
					{type === "search" 
						? `No offline results for "${query}"`
						: "No downloaded content available"
					}
				</h3>
				<p className="text-muted-foreground mb-4">
					{type === "search"
						? "Try searching with offline mode disabled or download some songs first."
						: "Download songs to enjoy them offline."
					}
				</p>
			</div>
			<Link href="/downloads">
				<Button variant="outline" className="gap-2">
					<Download className="h-4 w-4" />
					Go to Downloads
				</Button>
			</Link>
		</div>
	);
});
