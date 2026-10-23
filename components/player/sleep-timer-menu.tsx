"use client";

import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSleepTimer } from "@/hooks/playback/use-sleep-timer";
import { formatTime } from "@/lib/utils/time";

const NO_TIMER = "off";

/** Sleep timer: pauses playback after the chosen number of minutes. */
export function SleepTimerMenu() {
	const { isActive, timeRemaining, startTimer, cancelTimer, presets } =
		useSleepTimer();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					aria-label="Sleep timer"
					className={isActive ? "text-primary" : undefined}
				>
					<Moon className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" side="top" className="w-44">
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
