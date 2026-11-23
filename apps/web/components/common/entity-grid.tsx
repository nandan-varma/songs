"use client";

import { shuffle } from "es-toolkit";
import { motion } from "motion/react";
import { memo, useState } from "react";
import { toast } from "sonner";
import {
	EntityCard,
	EntityCardSkeleton,
	type EntityItem,
	type EntityKind,
} from "@/components/common/entity-card";
import { getAlbumById, getArtistById, getPlaylistById } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { logError } from "@/lib/utils/logger";
import type { DetailedSong } from "@/types/entity";

const GRID_CLASS =
	"grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";
const SHELF_CLASS =
	"grid grid-flow-col auto-cols-[42%] gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:auto-cols-[26%] md:auto-cols-[20%] lg:auto-cols-[16%] [&>*]:snap-start [scrollbar-width:none]";

const SONG_LOADERS: Record<
	EntityKind,
	(id: string) => Promise<DetailedSong[]>
> = {
	album: async (id) => (await getAlbumById(id)).songs,
	playlist: async (id) => (await getPlaylistById(id)).songs,
	artist: async (id) =>
		(await getArtistById(id, { songCount: 20 })).topSongs ?? [],
};

interface EntityGridProps {
	kind: EntityKind;
	items: EntityItem[];
	title: string;
	/** Lay items out as a single horizontally scrolling row. */
	shelf?: boolean;
	isLoading?: boolean;
	loadingCount?: number;
}

/** Titled grid (or horizontal shelf) of albums, playlists or artists with play-on-card. */
export const EntityGrid = memo(function EntityGrid({
	kind,
	items,
	title,
	shelf = false,
	isLoading = false,
	loadingCount = 6,
}: EntityGridProps) {
	const [loadingId, setLoadingId] = useState<string | null>(null);

	const play = async (item: EntityItem, shouldShuffle: boolean) => {
		try {
			setLoadingId(item.id);
			const songs = await SONG_LOADERS[kind](item.id);
			if (songs.length === 0) {
				toast.info(`${item.name} has no songs to play`);
				return;
			}
			useAppStore.getState().playQueue(shouldShuffle ? shuffle(songs) : songs);
		} catch (error) {
			logError(`EntityGrid:${kind}`, error);
			toast.error(`Could not play ${item.name}`);
		} finally {
			setLoadingId(null);
		}
	};

	if (!isLoading && items.length === 0) return null;

	return (
		<section className="space-y-2">
			<h2 className="text-base font-semibold sm:text-lg md:text-xl">{title}</h2>
			<motion.div
				className={shelf ? SHELF_CLASS : GRID_CLASS}
				initial="hidden"
				animate="show"
				transition={{ staggerChildren: 0.03 }}
			>
				{isLoading
					? Array.from({ length: loadingCount }, (_, index) => (
							<EntityCardSkeleton
								// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
								key={index}
								kind={kind}
							/>
						))
					: items.map((item) => (
							<motion.div
								key={item.id}
								className="h-full"
								whileHover={{ y: -4 }}
								whileTap={{ scale: 0.98 }}
								variants={{
									hidden: { opacity: 0, scale: 0.95 },
									show: { opacity: 1, scale: 1 },
								}}
							>
								<EntityCard
									kind={kind}
									item={item}
									isLoading={loadingId === item.id}
									onPlay={() => play(item, false)}
									onShuffle={
										kind === "artist" ? () => play(item, true) : undefined
									}
								/>
							</motion.div>
						))}
			</motion.div>
		</section>
	);
});
