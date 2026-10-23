"use client";

import { Maximize2 } from "lucide-react";
import Link from "next/link";
import { CoverImage } from "@/components/common/cover-image";
import { FavoriteButton } from "@/components/common/favorite-button";
import { SongLyrics } from "@/components/song/song-lyrics";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	useCurrentSong,
	useIsPlaying,
	useQueueLength,
} from "@/hooks/use-store";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PlaybackControls } from "./playback-controls";
import { ProgressBar } from "./progress-bar";

/** Full-screen view of the current song: large artwork, controls and lyrics. */
export function NowPlayingSheet() {
	const song = useCurrentSong();
	const isPlaying = useIsPlaying();
	const queueLength = useQueueLength();

	if (!song) return null;

	const { togglePlayPause, playPrevious, playNext, setSongTime } =
		useAppStore.getState();

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="ghost" size="icon" aria-label="Open now playing">
					<Maximize2 className="h-4 w-4" />
				</Button>
			</SheetTrigger>
			<SheetContent
				side="bottom"
				className="h-dvh gap-6 overflow-y-auto px-6 pt-12 pb-8"
			>
				<SheetTitle className="sr-only">Now playing: {song.name}</SheetTitle>
				<SheetDescription className="sr-only">
					Large artwork, playback controls and lyrics for the current song.
				</SheetDescription>

				<div
					className={cn(
						"mx-auto grid w-full gap-8 md:items-start",
						song.hasLyrics ? "max-w-5xl md:grid-cols-2" : "max-w-md",
					)}
				>
					<div className="mx-auto w-full max-w-md space-y-6">
						<div className="relative aspect-square w-full overflow-hidden rounded-xl shadow-2xl">
							<CoverImage
								images={song.image}
								alt={song.name}
								priority
								sizes="(max-width: 768px) 90vw, 448px"
							/>
						</div>

						<div className="flex items-center justify-between gap-3">
							<div className="min-w-0">
								<Link
									href={`/song?id=${song.id}`}
									className="block truncate text-2xl font-bold hover:underline"
								>
									{song.name}
								</Link>
								<p className="truncate text-muted-foreground">
									{song.artists.primary.map((artist) => artist.name).join(", ")}
								</p>
							</div>
							<FavoriteButton song={song} />
						</div>

						<ProgressBar onSeekTo={setSongTime} />
						<div className="flex justify-center">
							<PlaybackControls
								isPlaying={isPlaying}
								queueLength={queueLength}
								onTogglePlayPause={togglePlayPause}
								onPlayPrevious={playPrevious}
								onPlayNext={playNext}
							/>
						</div>
					</div>

					{song.hasLyrics && <SongLyrics songId={song.id} />}
				</div>
			</SheetContent>
		</Sheet>
	);
}
