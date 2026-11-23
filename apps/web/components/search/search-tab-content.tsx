"use client";

import { memo, type ReactNode } from "react";
import { useIsOffline } from "@/hooks/network/use-is-offline";
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
	const isOffline = useIsOffline();

	if (isLoading) {
		return <LoadingSpinner />;
	}

	if (!hasResults) {
		if (isOffline && !hasOfflineContent) {
			return <OfflineEmptyState query={query} type="search" />;
		}
		return (
			<EmptyState query={query} message={`No ${type} found for "${query}"`} />
		);
	}

	return <>{children}</>;
});
