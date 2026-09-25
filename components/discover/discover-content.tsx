"use client";

import { Loader2, Radio as RadioIcon } from "lucide-react";
import { motion } from "motion/react";
import { memo, useState } from "react";
import { PlaylistsList } from "@/components/playlists-list";
import { SongsList } from "@/components/songs-list";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCharts, useRadioStations, useTrending } from "@/hooks/data/queries";
import { getRadioFeatured } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { detailedSongToSong } from "@/lib/utils";
import { logError } from "@/lib/utils/logger";
import { Language, type RadioStation } from "@/types/entity";

const LANGUAGE_OPTIONS = [
	Language.ENGLISH,
	Language.HINDI,
	Language.PUNJABI,
	Language.TAMIL,
	Language.TELUGU,
];

function RadioStations({ stations }: { stations: RadioStation[] }) {
	const [loadingStation, setLoadingStation] = useState<string | null>(null);

	const handlePlay = async (station: RadioStation) => {
		try {
			setLoadingStation(station.name);
			const songs = await getRadioFeatured(station.name, station.language);
			if (songs.length > 0) {
				useAppStore.getState().playQueue(songs);
			}
		} catch (error) {
			logError("RadioStations:play", error);
		} finally {
			setLoadingStation(null);
		}
	};

	if (stations.length === 0) return null;

	return (
		<div className="space-y-2">
			<h2 className="text-base sm:text-lg md:text-xl font-semibold">
				Radio Stations
			</h2>
			<div className="grid gap-2 sm:gap-2.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
				{stations.map((station) => (
					<button
						key={station.name}
						type="button"
						onClick={() => handlePlay(station)}
						disabled={loadingStation !== null}
						className="flex items-center gap-2 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/60 disabled:opacity-60"
					>
						{loadingStation === station.name ? (
							<Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
						) : (
							<RadioIcon className="h-4 w-4 shrink-0 text-primary" />
						)}
						<span className="truncate text-xs sm:text-sm font-medium">
							{station.label}
						</span>
					</button>
				))}
			</div>
		</div>
	);
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
	const { data: charts = [] } = useCharts();
	const { data: stations = [] } = useRadioStations();

	const chartsAsPlaylists = charts.map((chart) => ({
		id: chart.id,
		title: chart.name,
		image: chart.image,
		url: chart.url,
		language: chart.language ?? contentLanguage,
		type: chart.type,
		description: chart.songCount ? `${chart.songCount} songs` : "",
	}));

	if (
		!isTrendingLoading &&
		trendingSongs.length === 0 &&
		charts.length === 0 &&
		stations.length === 0
	) {
		return null;
	}

	return (
		<motion.div
			className="space-y-6 md:space-y-8"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
		>
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
				songs={trendingSongs.map(detailedSongToSong)}
				isLoading={isTrendingLoading}
				emptyMessage="No trending songs right now"
			/>

			<PlaylistsList playlists={chartsAsPlaylists} />

			<RadioStations stations={stations} />
		</motion.div>
	);
});
