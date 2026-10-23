"use client";

import { Gauge, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePlaybackSpeed } from "@/hooks/playback/use-playback-speed";
import { useSleepTimer } from "@/hooks/playback/use-sleep-timer";
import { formatTime } from "@/lib/utils/time";

const NO_TIMER = "off";

/** Playback speed and sleep timer, tucked behind a single player button. */
export function PlaybackOptionsMenu() {
	const { speed, setSpeed, PLAYBACK_SPEEDS } = usePlaybackSpeed();
	const { isActive, timeRemaining, startTimer, cancelTimer, presets } =
		useSleepTimer();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					aria-label="Playback speed and sleep timer"
					className={isActive ? "text-primary" : undefined}
				>
					{isActive ? (
						<Moon className="h-4 w-4" />
					) : (
						<Gauge className="h-4 w-4" />
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" side="top" className="w-44">
				<DropdownMenuLabel>Speed</DropdownMenuLabel>
				<DropdownMenuRadioGroup
					value={String(speed)}
					onValueChange={(value) =>
						setSpeed(Number(value) as (typeof PLAYBACK_SPEEDS)[number])
					}
				>
					{PLAYBACK_SPEEDS.map((option) => (
						<DropdownMenuRadioItem key={option} value={String(option)}>
							{option}x
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
				<DropdownMenuSeparator />
				<DropdownMenuLabel>
					Sleep timer
					{isActive &&
						timeRemaining !== null &&
						` (${formatTime(timeRemaining)})`}
				</DropdownMenuLabel>
				<DropdownMenuRadioGroup
					value={NO_TIMER}
					onValueChange={(value) =>
						value === NO_TIMER
							? cancelTimer()
							: startTimer(Number(value) as (typeof presets)[number])
					}
				>
					<DropdownMenuRadioItem value={NO_TIMER}>Off</DropdownMenuRadioItem>
					{presets.map((minutes) => (
						<DropdownMenuRadioItem key={minutes} value={String(minutes)}>
							{minutes} min
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
