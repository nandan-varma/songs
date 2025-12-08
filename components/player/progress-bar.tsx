"use client";

import { memo, useCallback } from "react";
import { Slider } from "../ui/slider";

interface ProgressBarProps {
	currentTime: number;
	duration: number;
	onSeekTo: (time: number) => void;
}

function formatTime(seconds: number): string {
	if (Number.isNaN(seconds)) return "0:00";
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const ProgressBar = memo(function ProgressBar({
	currentTime,
	duration,
	onSeekTo,
}: ProgressBarProps) {
	const handleValueChange = useCallback(
		([value]: number[]) => {
			onSeekTo(value);
		},
		[onSeekTo],
	);

	return (
		<div className="flex items-center gap-3 w-full">
			<span className="text-xs text-muted-foreground w-10 text-right">
				{formatTime(currentTime)}
			</span>
			<Slider
				value={[currentTime]}
				max={duration > 0 ? duration : 0}
				step={1}
				onValueChange={handleValueChange}
				disabled={duration <= 0}
				className="flex-1"
				aria-label="Seek"
			/>
			<span className="text-xs text-muted-foreground w-10">
				{formatTime(duration)}
			</span>
		</div>
	);
});
