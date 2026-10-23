"use client";

import { memo, useCallback } from "react";
import { useCurrentTime, useDuration } from "@/hooks/use-store";
import { formatTime } from "@/lib/utils/time";
import { Slider } from "../ui/slider";

interface ProgressBarProps {
	onSeekTo: (time: number) => void;
}

/** Subscribes to playback time itself so ticks re-render only this bar, not the whole player. */
export const ProgressBar = memo(function ProgressBar({
	onSeekTo,
}: ProgressBarProps) {
	const currentTime = useCurrentTime();
	const duration = useDuration();
	const handleValueChange = useCallback(
		([value]: number[]) => {
			if (value !== undefined) {
				onSeekTo(value);
			}
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
