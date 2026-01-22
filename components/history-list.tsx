"use client";

import {
	Album,
	ListMusic,
	type LucideIcon,
	Mic2,
	Music,
	Play,
	Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import type { Route } from "next";
import Link from "next/link";
import { memo, useCallback, useState } from "react";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { HistoryItem } from "@/contexts/history-context";
import { useHistory } from "@/contexts/history-context";
import { usePlayerActions } from "@/contexts/player-context";
import { EntityType, type Image } from "@/types/entity";

interface HistoryItemProps {
	item: HistoryItem;
	compact?: boolean;
}

interface DisplayData {
	title: string;
	subtitle: string;
	secondaryInfo: string | null;
	images: Image[];
	href: string;
	icon: LucideIcon;
	canPlay: boolean;
}

/**
 * Individual history item component with type-aware rendering
 * Supports: Songs, Albums, Artists, Playlists
 */
const HistoryItemComponent = memo(function HistoryItemComponent({
	item,
	compact = false,
}: HistoryItemProps) {
	const [isLoading, setIsLoading] = useState(false);
	const { playSong } = usePlayerActions();
	const { removeFromHistory } = useHistory();

	// Get display data based on entity type
	const getDisplayData = (): DisplayData | null => {
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
	};

	const data = getDisplayData();

	const handlePlay = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (!data?.canPlay || item.type !== EntityType.SONG) return;

			setIsLoading(true);
			try {
				playSong(item.data);
			} catch (error) {
				console.error("Error playing song:", error);
			} finally {
				setIsLoading(false);
			}
		},
		[data, item, playSong],
	);

	const handleRemove = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			removeFromHistory(item.id);
		},
		[item.id, removeFromHistory],
	);

	if (!data) return null;

	const Icon = data.icon;
	const imageSize = compact
		? "h-10 w-10 sm:h-12 sm:w-12"
		: "h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16";
	const buttonSize = compact
		? "h-7 w-7 sm:h-8 sm:w-8"
		: "h-8 w-8 sm:h-9 sm:w-9";
	const iconSize = compact
		? "h-3 w-3 sm:h-3.5 sm:w-3.5"
		: "h-3.5 w-3.5 sm:h-4 sm:w-4";

	return (
		<Card className="overflow-hidden hover:bg-accent/50 transition-colors">
			<CardContent
				className={`p-2 sm:p-3 ${compact ? "md:p-2" : "md:p-4"} overflow-x-hidden`}
			>
				<div className="flex items-start gap-2 sm:gap-3 max-w-full">
					{/* Thumbnail */}
					<Link
						href={data.href as Route}
						className={`relative ${imageSize} shrink-0 overflow-hidden rounded`}
					>
						{data.images && data.images.length > 0 ? (
							<ProgressiveImage
								images={data.images}
								alt={data.title}
								className="object-cover transition-transform hover:scale-105"
							/>
						) : (
							<div className="w-full h-full bg-muted flex items-center justify-center">
								<Icon className="h-5 w-5 text-muted-foreground" />
							</div>
						)}
					</Link>

					{/* Content */}
					<div className="flex-1 min-w-0 py-0.5">
						<Link href={data.href as Route} className="block group">
							<h3
								className={`font-medium truncate group-hover:text-primary transition-colors ${
									compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
								} leading-tight`}
							>
								{data.title}
							</h3>
						</Link>
						<p
							className={`text-muted-foreground truncate mt-0.5 ${
								compact ? "text-[10px] sm:text-xs" : "text-xs"
							}`}
						>
							{data.subtitle}
						</p>
						{data.secondaryInfo && (
							<p
								className={`text-muted-foreground/80 truncate mt-0.5 ${
									compact ? "text-[10px] sm:text-xs" : "text-xs"
								}`}
							>
								{data.secondaryInfo}
							</p>
						)}
					</div>

					{/* Actions */}
					<div className="flex gap-0.5 sm:gap-1 shrink-0 items-start pt-0.5">
						{/* Play Button - Only for songs */}
						{data.canPlay && (
							<motion.div
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<Button
									size="icon"
									variant="ghost"
									onClick={handlePlay}
									disabled={isLoading}
									aria-label="Play"
									className={buttonSize}
								>
									<Play className={`${iconSize} fill-current`} />
								</Button>
							</motion.div>
						)}

						{/* Remove Button */}
						<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
							<Button
								size="icon"
								variant="ghost"
								onClick={handleRemove}
								aria-label="Remove from history"
								className={`${buttonSize} text-destructive hover:text-destructive`}
							>
								<Trash2 className={iconSize} />
							</Button>
						</motion.div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
});

interface HistoryListProps {
	items: HistoryItem[];
	compact?: boolean;
	emptyMessage?: string;
	className?: string;
}

/**
 * Optimized history list component
 * - Supports multiple entity types (songs, albums, artists, playlists)
 * - Type-aware rendering with appropriate actions
 * - Responsive layout for all screen sizes
 * - Memoized for performance
 */
export const HistoryList = memo(function HistoryList({
	items,
	compact = false,
	emptyMessage = "No recent activity",
	className = "",
}: HistoryListProps) {
	if (!items || items.length === 0) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-muted-foreground text-sm">{emptyMessage}</p>
			</div>
		);
	}

	return (
		<div
			className={`space-y-2 ${compact ? "sm:space-y-1.5" : "sm:space-y-2"} overflow-x-hidden ${className}`}
		>
			{items.map((item) => (
				<HistoryItemComponent
					key={`${item.type}-${item.id}`}
					item={item}
					compact={compact}
				/>
			))}
		</div>
	);
});
