/**
 * Hook for transforming history items into display format
 * Handles type-aware rendering data for songs
 */

import { type LucideIcon, Music } from "lucide-react";
import type { DetailedSong, Image } from "@/types/entity";

export interface DisplayData {
	title: string;
	subtitle: string;
	secondaryInfo: string | null;
	images: Image[];
	href: string;
	icon: LucideIcon;
	canPlay: boolean;
}

/**
 * Transforms history item (now song only) into standardized display data
 */
export function useHistoryDisplay(song: DetailedSong): DisplayData | null {
	if (!song) return null;

	const artists =
		song.artists.primary
			.map((a) => a.name)
			.slice(0, 2)
			.join(", ") + (song.artists.primary.length > 2 ? "..." : "");

	return {
		title: song.name,
		subtitle: artists,
		secondaryInfo: song.album?.name || null,
		images: song.image,
		href: `/song?id=${song.id}`,
		icon: Music,
		canPlay: true,
	};
}
