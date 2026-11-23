"use client";

import { useState } from "react";
import { Cover } from "@/components/cover";
import { NextButton, PlayPauseButton } from "@/components/player/controls";
import { NowPlaying } from "@/components/player/now-playing";
import { ProgressLine } from "@/components/player/seek-bar";
import { selectCurrentTrack, usePlayer } from "@/lib/stores/player";

export function MiniPlayer() {
	const track = usePlayer(selectCurrentTrack);
	const [open, setOpen] = useState(false);
	if (!track) return null;

	return (
		<div className="border-t bg-background/95 backdrop-blur">
			<ProgressLine />
			<div className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-2">
				<button
					type="button"
					onClick={() => setOpen(true)}
					className="flex min-w-0 flex-1 items-center gap-3 text-left"
					aria-label="Open now playing"
				>
					<Cover
						src={track.image}
						alt=""
						sizes="40px"
						className="size-10 shrink-0"
					/>
					<span className="min-w-0">
						<span className="block truncate text-sm font-medium">
							{track.title}
						</span>
						<span className="block truncate text-xs text-muted-foreground">
							{track.artists.map((a) => a.name).join(", ")}
						</span>
					</span>
				</button>
				<PlayPauseButton />
				<NextButton />
			</div>
			<NowPlaying track={track} open={open} onOpenChange={setOpen} />
		</div>
	);
}
