/**
 * Hook for transforming history items into display format
 * Handles type-aware rendering data for all entity types
 */

import { Album, ListMusic, type LucideIcon, Mic2, Music } from "lucide-react";
import type { HistoryItem } from "@/contexts/history-context";
import { EntityType, type Image } from "@/types/entity";

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
 * Transforms history item into standardized display data
 * Returns null if entity type is not supported
 */
export function useHistoryDisplay(item: HistoryItem): DisplayData | null {
	switch (item.type) {
		case EntityType.SONG: {
			const song = item.data;
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
		case EntityType.ALBUM: {
			const album = item.data;
			const artists =
				album.artists?.primary
					.map((a) => a.name)
					.slice(0, 2)
					.join(", ") + (album.artists.primary.length > 2 ? "..." : "");
			return {
				title: album.name,
				subtitle: artists || album.description,
				secondaryInfo: album.year ? `${album.year}` : null,
				images: album.image,
				href: `/album?id=${album.id}`,
				icon: Album,
				canPlay: false,
			};
		}
		case EntityType.ARTIST: {
			const artist = item.data;
			return {
				title: artist.name,
				subtitle: artist.type || "Artist",
				secondaryInfo: null,
				images: artist.image,
				href: `/artist?id=${artist.id}`,
				icon: Mic2,
				canPlay: false,
			};
		}
		case EntityType.PLAYLIST: {
			const playlist = item.data;
			return {
				title: playlist.name,
				subtitle: `${playlist.songCount || 0} songs`,
				secondaryInfo: null,
				images: playlist.image,
				href: `/playlist?id=${playlist.id}`,
				icon: ListMusic,
				canPlay: false,
			};
		}
		default:
			return null;
	}
}
