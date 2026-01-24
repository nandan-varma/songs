"use client";

import { memo, type ReactNode } from "react";
import { useOfflineStore } from "@/stores/offline-store";
import { EmptyState, LoadingSpinner, OfflineEmptyState } from "./search-states";

interface SearchTabContentProps {
	type: string;
	isLoading: boolean;
	hasResults: boolean;
	query: string;
	children?: ReactNode;
	hasOfflineContent?: boolean;
}

export const SearchTabContent = memo(function SearchTabContent({
	type,
	isLoading,
	hasResults,
	query,
	children,
	hasOfflineContent = true,
}: SearchTabContentProps) {
	const isOnline = useOfflineStore((state) => state.isOnline);
	const isOfflineMode = !isOnline;

	if (isLoading) {
		return <LoadingSpinner />;
	}

	if (!hasResults) {
		if (isOfflineMode && !hasOfflineContent) {
			return <OfflineEmptyState query={query} type="search" />;
		}
		return (
			<EmptyState query={query} message={`No ${type} found for "${query}"`} />
		);
	}

	return <>{children}</>;
});
