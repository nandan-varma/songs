"use client";

import { memo } from "react";
import { SongItem } from "@/components/song-item";
import { Skeleton } from "@/components/ui/skeleton";
import type { Song } from "@/types/entity";

interface SongsListProps {
	songs: Song[];
	compact?: boolean;
	emptyMessage?: string;
	className?: string;
	isLoading?: boolean;
	loadingCount?: number;
}

/**
 * SongItemSkeleton - Loading placeholder for song item
 * Matches dimensions of SongItem component
 */
const SongItemSkeleton = ({ compact = false }: { compact?: boolean }) => (
	<div className="flex items-start gap-3 sm:gap-4 md:gap-4 p-3 sm:p-4 md:p-4 rounded-lg bg-accent/20 animate-pulse min-h-14">
		{/* Album art placeholder */}
		<Skeleton
			className={`shrink-0 rounded-lg ${
				compact
					? "h-10 w-10 sm:h-12 sm:w-12 md:h-12 md:w-12"
					: "h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16"
			}`}
		/>
		{/* Song info placeholder */}
		<div className="flex-1 min-w-0 space-y-2 py-1">
			<Skeleton className="h-4 w-3/4 rounded" />
			<Skeleton className="h-3 w-1/2 rounded" />
			<Skeleton className="h-3 w-1/3 rounded" />
		</div>
		{/* Action buttons placeholder */}
		<div className="flex gap-2 sm:gap-2 md:gap-3 shrink-0">
			<Skeleton className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-lg" />
			<Skeleton className="hidden sm:block h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-lg" />
			<Skeleton className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-lg" />
		</div>
	</div>
);

/**
 * Optimized songs list container
 * - Responsive grid/stack layout
 * - Memoized to prevent unnecessary re-renders
 * - Supports compact mode for dense layouts
 * - Handles empty states gracefully
 * - Loading skeletons for perceived performance
 */
export const SongsList = memo(function SongsList({
	songs,
	compact = false,
	emptyMessage = "No songs found",
	className = "",
	isLoading = false,
	loadingCount = 6,
}: SongsListProps) {
	if (isLoading) {
		return (
			<div
				className={`space-y-2 ${compact ? "sm:space-y-1.5" : "sm:space-y-2"} overflow-x-hidden ${className}`}
			>
				{Array.from({ length: loadingCount }).map((_, i) => (
					// Skeleton items are static loading placeholders with a fixed count.
					// The index is stable and appropriate for keys here since items don't reorder.
					// biome-ignore lint/suspicious/noArrayIndexKey: skeleton keys are stable
					<SongItemSkeleton key={`skeleton-loading-${i}`} compact={compact} />
				))}
			</div>
		);
	}

	if (!songs || songs.length === 0) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-muted-foreground text-sm">{emptyMessage}</p>
			</div>
		);
	}

	return (
		<div
			className={`space-y-1 md:space-y-2 ${compact ? "sm:space-y-1" : "sm:space-y-1.5"} overflow-x-hidden ${className}`}
		>
			{songs.map((song) => (
				<SongItem key={song.id} song={song} compact={compact} />
			))}
		</div>
	);
});
