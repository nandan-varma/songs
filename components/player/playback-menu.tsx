"use client";

import {
	Moon,
	MoreHorizontal,
	Repeat,
	Repeat1,
	Shuffle,
	Zap,
} from "lucide-react";
import * as React from "react";
import { useQueue } from "@/contexts/player-context";
import { useQueueActions } from "@/contexts/queue-context";
import {
	PLAYBACK_SPEEDS,
	usePlaybackSpeed,
} from "@/hooks/playback/use-playback-speed";
import { useSleepTimer } from "@/hooks/playback/use-sleep-timer";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type RepeatMode = "off" | "all" | "track";

const REPEAT_MODES: RepeatMode[] = ["off", "all", "track"];

function formatTime(seconds: number | null): string {
	if (seconds === null) return "--:--";
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function PlaybackMenu() {
	const { isShuffleEnabled } = useQueue();
	const { toggleShuffle } = useQueueActions();
	const { speed, cycleSpeed } = usePlaybackSpeed();
	const { isActive, timeRemaining, presets, startTimer, cancelTimer } =
		useSleepTimer();
	const [repeatMode, setRepeatMode] = React.useState<RepeatMode>("off");

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-9 w-9">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>Playback</DropdownMenuLabel>
				<DropdownMenuSeparator />

				<DropdownMenuCheckboxItem
					checked={isShuffleEnabled}
					onCheckedChange={() => toggleShuffle()}
				>
					<Shuffle className="mr-2 h-4 w-4" />
					Shuffle
				</DropdownMenuCheckboxItem>

				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						{repeatMode === "track" ? (
							<Repeat1 className="mr-2 h-4 w-4" />
						) : (
							<Repeat className="mr-2 h-4 w-4" />
						)}
						<span>Repeat: {repeatMode}</span>
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						<DropdownMenuRadioGroup
							value={repeatMode}
							onValueChange={(v) => setRepeatMode(v as RepeatMode)}
						>
							{REPEAT_MODES.map((mode) => (
								<DropdownMenuRadioItem key={mode} value={mode}>
									{mode === "track"
										? "One"
										: mode.charAt(0).toUpperCase() + mode.slice(1)}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				<DropdownMenuSeparator />

				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<Zap className="mr-2 h-4 w-4" />
						<span>Speed: {speed}x</span>
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						<DropdownMenuRadioGroup
							value={String(speed)}
							onValueChange={() => cycleSpeed()}
						>
							{PLAYBACK_SPEEDS.map((s) => (
								<DropdownMenuRadioItem key={s} value={String(s)}>
									{s}x
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				<DropdownMenuSeparator />

				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<Moon className="mr-2 h-4 w-4" />
						<span>Sleep Timer</span>
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						{isActive && timeRemaining !== null ? (
							<DropdownMenuCheckboxItem
								checked
								onCheckedChange={() => cancelTimer()}
							>
								Cancel: {formatTime(timeRemaining)}
							</DropdownMenuCheckboxItem>
						) : (
							presets.map((minutes) => (
								<DropdownMenuCheckboxItem
									key={minutes}
									onCheckedChange={() => startTimer(minutes)}
								>
									{minutes} minutes
								</DropdownMenuCheckboxItem>
							))
						)}
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
