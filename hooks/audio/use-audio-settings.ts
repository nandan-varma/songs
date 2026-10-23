import { useEffect } from "react";

interface UseAudioSettingsProps {
	audioRef: React.RefObject<HTMLAudioElement | null>;
	volume: number;
	isMuted: boolean;
}

export function useAudioSettings({
	audioRef,
	volume,
	isMuted,
}: UseAudioSettingsProps) {
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) {
			return;
		}

		audio.volume = volume;
		audio.muted = isMuted;
	}, [audioRef, isMuted, volume]);
}
