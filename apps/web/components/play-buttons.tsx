"use client";

import { Play, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Track } from "@/lib/models";
import { usePlayer } from "@/lib/stores/player";

/** Fisher-Yates over a copy, so the source list keeps its order. */
function shuffled<T>(items: T[]): T[] {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
	}
	return copy;
}

export function PlayButtons({ tracks }: { tracks: Track[] }) {
	const play = usePlayer((s) => s.play);
	const disabled = tracks.length === 0;
	return (
		<div className="flex gap-2">
			<Button disabled={disabled} onClick={() => play(tracks)}>
				<Play /> Play
			</Button>
			<Button
				variant="secondary"
				disabled={disabled}
				onClick={() => play(shuffled(tracks))}
			>
				<Shuffle /> Shuffle
			</Button>
		</div>
	);
}
