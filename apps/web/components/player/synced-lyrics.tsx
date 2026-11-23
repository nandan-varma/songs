"use client";

import { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSyncedLyrics } from "@/lib/api/queries";
import type { Track } from "@/lib/models";
import { seekTo } from "@/lib/player/engine";
import { useClock } from "@/lib/stores/player";
import { cn } from "@/lib/utils";

export function SyncedLyrics({ track }: { track: Track }) {
	const artist = track.artists[0]?.name ?? "";
	const { data, isPending } = useSyncedLyrics(
		track.title,
		artist,
		track.duration,
	);
	const time = useClock((s) => s.currentTime);
	const active = data
		? data.findLastIndex((line) => line.time <= time + 0.25)
		: -1;
	const lines = useRef<(HTMLButtonElement | null)[]>([]);

	useEffect(() => {
		if (active < 0) return;
		lines.current[active]?.scrollIntoView({
			block: "center",
			behavior: "smooth",
		});
	}, [active]);

	if (isPending) {
		return (
			<div aria-busy className="space-y-3 py-6">
				<Skeleton className="h-6 w-3/4" />
				<Skeleton className="h-6 w-1/2" />
				<Skeleton className="h-6 w-2/3" />
			</div>
		);
	}
	if (!data) {
		return (
			<p className="py-10 text-center text-muted-foreground">
				No synced lyrics for this song.
			</p>
		);
	}
	return (
		<div className="max-h-[52dvh] space-y-4 overflow-y-auto py-6 [mask-image:linear-gradient(transparent,black_12%,black_88%,transparent)] [scrollbar-width:none]">
			{data.map((line, index) => (
				<button
					key={line.time}
					ref={(node) => {
						lines.current[index] = node;
					}}
					type="button"
					onClick={() => seekTo(line.time)}
					className={cn(
						"block w-full origin-left text-left text-2xl font-bold transition duration-300",
						index === active
							? "scale-100 opacity-100"
							: "scale-95 opacity-35 blur-[0.5px] hover:opacity-70",
					)}
				>
					{line.text || "\u266a"}
				</button>
			))}
		</div>
	);
}
