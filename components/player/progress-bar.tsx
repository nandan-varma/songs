"use client";

import { memo, useCallback } from "react";
import { formatTime } from "@/lib/utils/time";
import { Slider } from "../ui/slider";

interface ProgressBarProps {
	currentTime: number;
	duration: number;
	onSeekTo: (time: number) => void;
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

	const maxDuration = duration || 100;

	return (
		<div className="flex items-center gap-2 md:gap-3 w-full">
			<span className="text-xs text-muted-foreground w-9 md:w-10 text-right">
				{formatTime(currentTime)}
			</span>
			<Slider
				value={[currentTime]}
				max={maxDuration}
				step={1}
				onValueChange={handleValueChange}
				className="flex-1"
				aria-label="Seek"
			/>
			<span className="text-xs text-muted-foreground w-9 md:w-10">
				{formatTime(duration)}
			</span>
		</div>
	);
});
