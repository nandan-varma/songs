"use client";

import { Slider } from "@/components/ui/slider";
import { seekTo } from "@/lib/player/engine";
import { useClock } from "@/lib/stores/player";
import { formatTime } from "@/lib/utils";

export function SeekBar() {
	const currentTime = useClock((s) => s.currentTime);
	const duration = useClock((s) => s.duration);
	return (
		<div>
			<Slider
				aria-label="Seek"
				value={[currentTime]}
				max={duration || 1}
				step={1}
				onValueChange={([time]) => seekTo(time ?? 0)}
			/>
			<div className="flex justify-between text-xs text-muted-foreground tabular-nums">
				<span>{formatTime(currentTime)}</span>
				<span>{formatTime(duration)}</span>
			</div>
		</div>
	);
}

export function ProgressLine() {
	const fraction = useClock((s) =>
		s.duration > 0 ? s.currentTime / s.duration : 0,
	);
	return (
		<div className="h-0.5 bg-secondary">
			<div
				className="h-full bg-primary"
				style={{ width: `${fraction * 100}%` }}
			/>
		</div>
	);
}
