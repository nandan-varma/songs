"use client";

import { Loader2, Pause, Play } from "lucide-react";
import Link from "next/link";
import { memo, useCallback, useState } from "react";
import { FavoriteButton } from "@/components/common/favorite-button";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { SongActionMenu } from "@/components/common/song-action-menu";
import { getSongById } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { logError } from "@/lib/utils/logger";
import { formatTime } from "@/lib/utils/time";
import type { DetailedSong, Song } from "@/types/entity";

interface SongItemProps {
	song: Song;
	/** 1-based position shown in the leading column; omit to show only artwork. */
	index?: number;
	/** Full song data when the list already has it; avoids a fetch on play. */
	detailed?: DetailedSong;
	/** Songs to queue when this row is played, starting at this song. */
	queue?: DetailedSong[];
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
	detailed,
	queue,
	compact = false,
}: SongItemProps) {
	const [isLoading, setIsLoading] = useState(false);
	const isCurrent = useAppStore((state) => state.currentSong?.id === song.id);
	const isPlaying = useAppStore((state) => isCurrent && state.isPlaying);

	const handlePlay = useCallback(async () => {
		const state = useAppStore.getState();
		if (isCurrent) {
			state.togglePlayPause();
			return;
		}
		if (isLoading) return;

		try {
			setIsLoading(true);
			const startIndex = queue?.findIndex((item) => item.id === song.id) ?? -1;
			if (queue && startIndex >= 0) {
				state.playQueue(queue, startIndex);
				state.addToPlaybackHistory(queue[startIndex] as DetailedSong);
				return;
			}
			const [fetched] = await getSongById(song.id);
			if (!fetched) return;
			state.playSong(fetched);
			state.addToPlaybackHistory(fetched);
		} catch (error) {
			logError("SongItem:play", error);
		} finally {
			setIsLoading(false);
		}
	}, [isCurrent, isLoading, queue, song.id]);

	const artwork = compact ? "h-9 w-9" : "h-10 w-10";
	const PlayIcon = isPlaying ? Pause : Play;

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
				aria-label={isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
				className={cn(
					"relative shrink-0 overflow-hidden rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
					artwork,
				)}
			>
				<ProgressiveImage
					images={song.image}
					alt=""
					className="object-cover"
					sizes="40px"
				/>
				<span
					className={cn(
						"absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
						(isLoading || isCurrent) && "opacity-100",
					)}
				>
					{isLoading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<PlayIcon className="h-4 w-4 fill-current" />
					)}
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
					{song.title}
				</Link>
				<p className="truncate text-xs text-muted-foreground">
					{song.primaryArtists || song.singers}
				</p>
			</div>

			{!compact && song.album && (
				<span className="hidden w-1/4 truncate text-sm text-muted-foreground lg:block">
					{song.album}
				</span>
			)}

			{detailed && <FavoriteButton song={detailed} />}

			{detailed && (
				<span className="hidden w-10 text-right text-xs tabular-nums text-muted-foreground sm:block">
					{formatTime(detailed.duration ?? 0)}
				</span>
			)}

			<SongActionMenu song={song} />
		</div>
	);
});
