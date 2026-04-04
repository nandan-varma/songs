"use client";

import { Volume2, VolumeX } from "lucide-react";
import { motion } from "motion/react";
import { memo, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { percentToVolume, volumeToPercent } from "@/lib/utils/time";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";

interface VolumeControlProps {
	volume: number;
	onSetVolume: (volume: number) => void;
}

/**
 * Volume Control - Better touch targets for mobile
 * - Larger mute button (40-48px)
 * - Responsive slider width
 * - Smooth transitions and hover states
 */
export const VolumeControl = memo(function VolumeControl({
	volume,
	onSetVolume,
}: VolumeControlProps) {
	const isMuted = useAppStore((state) => state.isMuted);

	const toggleMute = useCallback(() => {
		const store = useAppStore.getState();
		if (store.isMuted) {
			// Unmute - restore to last non-zero volume or default
			onSetVolume(Math.max(0.3, volume === 0 ? 0.5 : volume));
			store.setIsMuted(false);
		} else {
			// Mute
			onSetVolume(0);
			store.setIsMuted(true);
		}
	}, [volume, onSetVolume]);

	const handleVolumeChange = useCallback(
		([value]: number[]) => {
			if (value !== undefined) {
				const newVolume = percentToVolume(value);
				onSetVolume(newVolume);

				// Unmute if volume is increased above 0
				if (value > 0 && isMuted) {
					useAppStore.getState().setIsMuted(false);
				}
			}
		},
		[onSetVolume, isMuted],
	);

	const isSilent = isMuted || volume === 0;

	return (
		<div className="flex items-center gap-3 sm:gap-4">
			<motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
				<Button
					variant="ghost"
					size="icon"
					onClick={toggleMute}
					className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 hover:bg-primary/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary"
					aria-label={isSilent ? "Unmute" : "Mute"}
				>
					{isSilent ? (
						<VolumeX className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6" />
					) : (
						<Volume2 className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6" />
					)}
				</Button>
			</motion.div>

			<Slider
				value={[volumeToPercent(volume)]}
				max={100}
				step={1}
				onValueChange={handleVolumeChange}
				className="w-20 sm:w-24 md:w-28"
				aria-label="Volume"
			/>
		</div>
	);
});
