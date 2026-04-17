"use client";

import { useEffect } from "react";

interface UseAudioSettingsProps {
	audioRef: React.RefObject<HTMLAudioElement | null>;
	volume: number;
	playbackSpeed: number;
	isMuted: boolean;
}

export function useAudioSettings({
	audioRef,
	volume,
	playbackSpeed,
	isMuted,
}: UseAudioSettingsProps) {
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) {
			return;
		}

		audio.volume = volume;
		audio.playbackRate = playbackSpeed;
		audio.muted = isMuted;
	}, [audioRef, isMuted, playbackSpeed, volume]);
}
