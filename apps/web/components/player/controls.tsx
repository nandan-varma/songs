"use client";

import {
	Pause,
	Play,
	Repeat,
	Repeat1,
	SkipBack,
	SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { skipPrevious } from "@/lib/player/engine";
import { usePlayer } from "@/lib/stores/player";
import { cn } from "@/lib/utils";

export function PlayPauseButton({ className }: { className?: string }) {
	const playing = usePlayer((s) => s.playing);
	const toggle = usePlayer((s) => s.toggle);
	return (
		<Button
			size="icon"
			aria-label={playing ? "Pause" : "Play"}
			onClick={toggle}
			className={cn("rounded-full", className)}
		>
			{playing ? (
				<Pause className="fill-current" />
			) : (
				<Play className="fill-current" />
			)}
		</Button>
	);
}

export function NextButton() {
	const next = usePlayer((s) => s.next);
	return (
		<Button variant="ghost" size="icon" aria-label="Next" onClick={next}>
			<SkipForward />
		</Button>
	);
}

export function PlaybackControls() {
	const repeat = usePlayer((s) => s.repeat);
	const cycleRepeat = usePlayer((s) => s.cycleRepeat);
	const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;
	return (
		<div className="flex items-center justify-center gap-3">
			<Button
				variant="ghost"
				size="icon"
				aria-label={`Repeat: ${repeat}`}
				onClick={cycleRepeat}
				className={cn(repeat === "off" && "text-muted-foreground")}
			>
				<RepeatIcon />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				aria-label="Previous"
				onClick={skipPrevious}
			>
				<SkipBack />
			</Button>
			<PlayPauseButton className="size-14 [&_svg]:size-6" />
			<NextButton />
		</div>
	);
}
