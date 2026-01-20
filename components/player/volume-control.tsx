"use client";

import { Volume2, VolumeX } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { percentToVolume, volumeToPercent } from "@/lib/utils/time";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";

interface VolumeControlProps {
	volume: number;
	onSetVolume: (volume: number) => void;
}

export const VolumeControl = memo(function VolumeControl({
	volume,
	onSetVolume,
}: VolumeControlProps) {
	const [isMuted, setIsMuted] = useState(false);
	const [previousVolume, setPreviousVolume] = useState(volume);

	const toggleMute = useCallback(() => {
		if (isMuted) {
			onSetVolume(previousVolume);
			setIsMuted(false);
		} else {
			setPreviousVolume(volume);
			onSetVolume(0);
			setIsMuted(true);
		}
	}, [isMuted, volume, previousVolume, onSetVolume]);

	const handleVolumeChange = useCallback(
		([value]: number[]) => {
			const newVolume = percentToVolume(value);
			onSetVolume(newVolume);

			if (value > 0 && isMuted) {
				setIsMuted(false);
			}
		},
		[onSetVolume, isMuted],
	);

	const isSilent = isMuted || volume === 0;

	return (
		<div className="flex items-center gap-3">
			<Button
				variant="ghost"
				size="icon"
				onClick={toggleMute}
				className="h-10 w-10"
				aria-label={isSilent ? "Unmute" : "Mute"}
			>
				{isSilent ? (
					<VolumeX className="h-5 w-5" />
				) : (
					<Volume2 className="h-5 w-5" />
				)}
			</Button>

			<Slider
				value={[volumeToPercent(volume)]}
				max={100}
				step={1}
				onValueChange={handleVolumeChange}
				className="w-28"
				aria-label="Volume"
			/>
		</div>
	);
});
