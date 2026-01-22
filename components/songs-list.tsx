"use client";

import { memo } from "react";
import { SongItem } from "@/components/song-item";
import type { Song } from "@/types/entity";

interface SongsListProps {
	songs: Song[];
	compact?: boolean;
	emptyMessage?: string;
	className?: string;
}

/**
 * Optimized songs list container
 * - Responsive grid/stack layout
 * - Memoized to prevent unnecessary re-renders
 * - Supports compact mode for dense layouts
 * - Handles empty states gracefully
 */
export const SongsList = memo(function SongsList({
	songs,
	compact = false,
	emptyMessage = "No songs found",
	className = "",
}: SongsListProps) {
	if (!songs || songs.length === 0) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-muted-foreground text-sm">{emptyMessage}</p>
			</div>
		);
	}

	return (
		<div
			className={`space-y-2 ${compact ? "sm:space-y-1.5" : "sm:space-y-2"} overflow-x-hidden ${className}`}
		>
			{songs.map((song) => (
				<SongItem key={song.id} song={song} compact={compact} />
			))}
		</div>
	);
});
