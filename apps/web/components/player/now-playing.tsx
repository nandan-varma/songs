"use client";

import { ChevronDown, ListMusic, Volume2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Cover } from "@/components/cover";
import { FavoriteButton } from "@/components/favorite-button";
import { PlaybackControls } from "@/components/player/controls";
import { QueueList } from "@/components/player/queue-list";
import { SeekBar } from "@/components/player/seek-bar";
import { ArtistLinks } from "@/components/track-list";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import type { Track } from "@/lib/models";
import { usePlayer } from "@/lib/stores/player";

interface NowPlayingProps {
	track: Track;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function NowPlaying({ track, open, onOpenChange }: NowPlayingProps) {
	const [showQueue, setShowQueue] = useState(false);
	const volume = usePlayer((s) => s.volume);
	const setVolume = usePlayer((s) => s.setVolume);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="top-0 left-0 h-dvh max-w-none translate-x-0 translate-y-0 content-start overflow-y-auto rounded-none border-0 p-4 sm:p-6">
				<DialogTitle className="sr-only">Now playing</DialogTitle>
				<DialogDescription className="sr-only">{track.title}</DialogDescription>
				<div className="mx-auto grid w-full max-w-md gap-6">
					<div className="flex items-center justify-between">
						<DialogClose asChild>
							<Button variant="ghost" size="icon" aria-label="Close">
								<ChevronDown />
							</Button>
						</DialogClose>
						<Button
							variant={showQueue ? "secondary" : "ghost"}
							size="icon"
							aria-label="Toggle queue"
							aria-pressed={showQueue}
							onClick={() => setShowQueue((v) => !v)}
						>
							<ListMusic />
						</Button>
					</div>
					{showQueue ? (
						<QueueList />
					) : (
						<>
							<Cover
								src={track.image}
								alt={track.title}
								sizes="448px"
								priority
								className="w-full"
							/>
							<div className="flex items-center gap-2">
								<div className="min-w-0 flex-1">
									<h2 className="truncate text-xl font-semibold">
										<Link
											href={`/song/${track.id}`}
											onClick={() => onOpenChange(false)}
										>
											{track.title}
										</Link>
									</h2>
									<ArtistLinks
										artists={track.artists}
										className="block text-muted-foreground"
									/>
								</div>
								<FavoriteButton track={track} />
							</div>
							<SeekBar />
							<PlaybackControls />
							<div className="hidden items-center gap-2 md:flex">
								<Volume2 className="size-4 text-muted-foreground" />
								<Slider
									aria-label="Volume"
									value={[volume]}
									max={1}
									step={0.01}
									onValueChange={([v]) => setVolume(v ?? 0)}
								/>
							</div>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
