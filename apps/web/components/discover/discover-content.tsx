"use client";

import { Loader2, Radio as RadioIcon } from "lucide-react";
import { motion } from "motion/react";
import { memo, useState } from "react";
import { toast } from "sonner";
import { EntityGrid } from "@/components/common/entity-grid";
import { SongsList } from "@/components/songs-list";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCharts, useTrending } from "@/hooks/data/queries";
import { useAppStore } from "@/lib/store";
import { albumToItem, playlistToItem } from "@/lib/utils/entity-items";
import { logError } from "@/lib/utils/logger";
import { Language } from "@/types/entity";

const LANGUAGE_OPTIONS = [
	Language.ENGLISH,
	Language.HINDI,
	Language.PUNJABI,
	Language.TAMIL,
	Language.TELUGU,
];

const TRENDING_SONGS_SHOWN = 10;

function getGreeting(): string {
	const hour = new Date().getHours();
	if (hour < 12) return "Good morning";
	return hour < 18 ? "Good afternoon" : "Good evening";
}

/**
 * Shown on the home page when there is no active search query: trending songs,
 * editorial charts, and featured radio stations, mirroring the native app's Home tab.
 */
export const DiscoverContent = memo(function DiscoverContent() {
	const contentLanguage = useAppStore((state) => state.contentLanguage);
	const setContentLanguage = useAppStore((state) => state.setContentLanguage);

	const { data: trendingSongs = [], isLoading: isTrendingLoading } =
		useTrending("song", contentLanguage);
	const { data: trendingAlbums = [], isLoading: isAlbumsLoading } = useTrending(
		"album",
		contentLanguage,
	);
	const { data: trendingPlaylists = [] } = useTrending(
		"playlist",
		contentLanguage,
	);
	const { data: charts = [] } = useCharts();

	if (
		!isTrendingLoading &&
		trendingSongs.length === 0 &&
		trendingAlbums.length === 0 &&
		trendingPlaylists.length === 0 &&
		charts.length === 0
	) {
		return null;
	}

	return (
		<motion.div
			className="space-y-6 md:space-y-8"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
		>
			<h1 className="text-2xl md:text-3xl font-bold" suppressHydrationWarning>
				{getGreeting()}
			</h1>

			<div className="flex items-center justify-between">
				<h2 className="text-base sm:text-lg md:text-xl font-semibold">
					Trending
				</h2>
				<Select value={contentLanguage} onValueChange={setContentLanguage}>
					<SelectTrigger className="w-36" size="sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{LANGUAGE_OPTIONS.map((language) => (
							<SelectItem
								key={language}
								value={language}
								className="capitalize"
							>
								{language}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<SongsList
				songs={trendingSongs.slice(0, TRENDING_SONGS_SHOWN)}
				numbered
				isLoading={isTrendingLoading}
				emptyMessage="No trending songs right now"
			/>

			<EntityGrid
				shelf
				kind="album"
				title="Trending Albums"
				items={trendingAlbums.map(albumToItem)}
				isLoading={isAlbumsLoading}
			/>

			<EntityGrid
				shelf
				kind="playlist"
				title="Trending Playlists"
				items={trendingPlaylists.map(playlistToItem)}
			/>

			<EntityGrid
				shelf
				kind="playlist"
				title="Charts"
				items={charts.map(playlistToItem)}
			/>
		</motion.div>
	);
});
