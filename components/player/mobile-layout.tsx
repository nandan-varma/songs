"use client";

import { Pause, Play } from "lucide-react";
import { memo } from "react";
import { CoverImage } from "@/components/common/cover-image";
import { FavoriteButton } from "@/components/common/favorite-button";
import { Button } from "@/components/ui/button";
import { useCurrentTime, useDuration } from "@/hooks/use-store";
import type { DetailedSong } from "@/types/entity";
import { NowPlayingSheet } from "./now-playing-sheet";

interface MobileLayoutProps {
	currentSong: DetailedSong | null;
	isPlaying: boolean;
	onTogglePlayPause: () => void;
}

/** Thin progress line along the bottom edge of the mini player. */
function MiniProgress() {
	const currentTime = useCurrentTime();
	const duration = useDuration();
	const percent =
		duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

	return (
		<div className="absolute inset-x-3 bottom-0 h-0.5 overflow-hidden rounded-full bg-white/10">
			<div
				className="h-full bg-primary transition-[width] duration-200"
				style={{ width: `${percent}%` }}
			/>
		</div>
	);
}

/**
 * Compact mini player: artwork, title, like and play/pause.
 * Tapping the song opens the full-screen player, which holds seek, skip, queue and lyrics.
 */
export const MobileLayout = memo(function MobileLayout({
	currentSong,
	isPlaying,
	onTogglePlayPause,
}: MobileLayoutProps) {
	if (!currentSong) return null;

	return (
		<div className="relative flex w-full items-center gap-2 pb-1 md:hidden">
			<NowPlayingSheet>
				<button
					type="button"
					aria-label={`Open player for ${currentSong.name}`}
					className="flex min-w-0 flex-1 items-center gap-3 text-left"
				>
					<div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md">
						<CoverImage
							images={currentSong.image}
							alt=""
							priority
							sizes="48px"
						/>
					</div>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold">{currentSong.name}</p>
						<p className="truncate text-xs text-muted-foreground">
							{currentSong.artists.primary
								.map((artist) => artist.name)
								.join(", ")}
						</p>
					</div>
				</button>
			</NowPlayingSheet>

			<FavoriteButton song={currentSong} />
			<Button
				size="icon"
				variant="ghost"
				onClick={onTogglePlayPause}
				aria-label={isPlaying ? "Pause" : "Play"}
				className="h-11 w-11"
			>
				{isPlaying ? (
					<Pause className="h-6 w-6 fill-current" />
				) : (
					<Play className="h-6 w-6 fill-current" />
				)}
			</Button>
			<MiniProgress />
		</div>
	);
});
