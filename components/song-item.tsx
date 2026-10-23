"use client";

import { PauseIcon, PlayIcon } from "@animateicons/react/lucide";
import Link from "next/link";
import { memo, useCallback } from "react";
import { CoverImage } from "@/components/common/cover-image";
import { FavoriteButton } from "@/components/common/favorite-button";
import { SongActionMenu } from "@/components/common/song-action-menu";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { logError } from "@/lib/utils/logger";
import { formatTime } from "@/lib/utils/time";
import type { DetailedSong } from "@/types/entity";

interface SongItemProps {
	song: DetailedSong;
	/** 1-based position shown in the leading column; omit to show only artwork. */
	index?: number;
	/** The list this row belongs to; playing a row queues the whole list from that song. */
	queue: DetailedSong[];
	compact?: boolean;
}

function EqualizerBars() {
	return (
		<span className="flex h-3.5 items-end gap-0.5" aria-hidden="true">
			{[0, 150, 300].map((delay) => (
				<span
					key={delay}
					className="w-0.5 animate-pulse rounded-full bg-primary"
					style={{ height: "100%", animationDelay: `${delay}ms` }}
				/>
			))}
		</span>
	);
}

export const SongItem = memo(function SongItem({
	song,
	index,
	queue,
	compact = false,
}: SongItemProps) {
	const isCurrent = useAppStore((state) => state.currentSong?.id === song.id);
	const isPlaying = useAppStore((state) => isCurrent && state.isPlaying);

	const handlePlay = useCallback(() => {
		const state = useAppStore.getState();
		if (isCurrent) {
			state.togglePlayPause();
			return;
		}
		state.playQueue(
			queue,
			queue.findIndex((item) => item.id === song.id),
		);
		state.addToPlaybackHistory(song);
	}, [isCurrent, queue, song]);

	const artwork = compact ? "h-9 w-9" : "h-10 w-10";
	const ActionIcon = isPlaying ? PauseIcon : PlayIcon;

	return (
		<div
			className={cn(
				"group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent/60",
				isCurrent && "bg-accent/40",
			)}
		>
			{index !== undefined && (
				<span className="hidden w-6 shrink-0 justify-center text-sm tabular-nums text-muted-foreground sm:flex">
					{isPlaying ? (
						<EqualizerBars />
					) : (
						<span className={cn(isCurrent && "text-primary")}>{index}</span>
					)}
				</span>
			)}

			<button
				type="button"
				onClick={handlePlay}
				aria-label={isPlaying ? `Pause ${song.name}` : `Play ${song.name}`}
				className={cn(
					"relative shrink-0 overflow-hidden rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
					artwork,
				)}
			>
				<CoverImage
					images={song.image}
					alt=""
					className="object-cover"
					sizes="40px"
				/>
				<span
					className={cn(
						"absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
						isCurrent && "opacity-100",
					)}
				>
					<ActionIcon size={16} className="fill-current" />
				</span>
			</button>

			<div className="min-w-0 flex-1">
				<Link
					href={`/song?id=${song.id}`}
					className={cn(
						"block truncate text-sm font-medium hover:underline",
						isCurrent && "text-primary",
					)}
				>
					{song.name}
				</Link>
				<p className="truncate text-xs text-muted-foreground">
					{song.artists.primary.map((artist) => artist.name).join(", ")}
				</p>
			</div>

			{!compact && song.album.name && (
				<span className="hidden w-1/4 truncate text-sm text-muted-foreground lg:block">
					{song.album.name}
				</span>
			)}

			<FavoriteButton song={song} />

			<span className="hidden w-10 text-right text-xs tabular-nums text-muted-foreground sm:block">
				{formatTime(song.duration ?? 0)}
			</span>

			<SongActionMenu song={song} />
		</div>
	);
});
