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

const SongItemSkeleton = ({ compact = false }: { compact?: boolean }) => (
	<div className="flex items-start gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg bg-accent/20 animate-pulse min-h-12">
		<Skeleton
			className={`shrink-0 rounded ${
				compact ? "h-9 w-9 sm:h-10 sm:w-10" : "h-10 w-10 sm:h-12 sm:w-12"
			}`}
		/>
		<div className="flex-1 min-w-0 space-y-1 py-0.5">
			<Skeleton className="h-3 w-3/4 rounded" />
			<Skeleton className="h-2 w-1/2 rounded" />
		</div>
		<div className="flex gap-1.5 sm:gap-2 shrink-0">
			<Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded" />
			<Skeleton className="hidden sm:block h-8 w-8 sm:h-9 sm:w-9 rounded" />
		</div>
	</div>
);

export const SongsList = memo(function SongsList({
	songs,
	compact = false,
	emptyMessage = "No songs found",
	className = "",
	isLoading = false,
	loadingCount = 10,
}: SongsListProps) {
	if (isLoading) {
		return (
			<div
				className={`space-y-1 ${compact ? "sm:space-y-0.5" : "sm:space-y-1"} overflow-x-hidden ${className}`}
			>
				{Array.from({ length: loadingCount }).map((_, i) => (
					<SongItemSkeleton key={`skeleton-loading-${i}`} compact={compact} />
				))}
			</div>
		);
	}

	if (!songs || songs.length === 0) {
		return (
			<div className="flex items-center justify-center py-8">
				<p className="text-muted-foreground text-xs sm:text-sm">
					{emptyMessage}
				</p>
			</div>
		);
	}

	return (
		<div
			className={`space-y-0.5 ${compact ? "sm:space-y-0.5" : "sm:space-y-1"} overflow-x-hidden ${className}`}
		>
			{songs.map((song) => (
				<SongItem key={song.id} song={song} compact={compact} />
			))}
		</div>
	);
});
