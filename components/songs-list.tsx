"use client";

import React, { useCallback } from "react";
import { toast } from "sonner";
import { useDownloadsActions } from "@/contexts/downloads-context";
import { usePlayerActions } from "@/contexts/player-context";
import { useQueueActions } from "@/contexts/queue-context";

import type { DetailedSong, Song } from "@/lib/types";
import { SongItem } from "./song-item";

interface SongsListProps {
	songs: (Song | DetailedSong)[];
}

export const SongsList = React.memo(function SongsList({
	songs,
}: SongsListProps) {
	const { playSong } = usePlayerActions();
	const { addSong } = useQueueActions();
	const { downloadSong } = useDownloadsActions();

	const handlePlay = useCallback(
		async (song: Song | DetailedSong) => {
			// For DetailedSong, play directly; for Song, it may not work perfectly but try
			playSong(song as DetailedSong);
		},
		[playSong],
	);

	const handleAddToQueue = useCallback(
		async (song: Song | DetailedSong) => {
			addSong(song as DetailedSong);
		},
		[addSong],
	);

	const handleDownload = useCallback(
		async (song: Song | DetailedSong) => {
			try {
				await downloadSong(song as DetailedSong);
				toast.success(
					`Downloaded: ${(song as any).name || (song as any).title}`,
				);
			} catch (err) {
				toast.error("Failed to download");
				console.error(err);
			}
		},
		[downloadSong],
	);

	if (songs.length === 0) {
		return null;
	}

	return (
		<div className="space-y-3">
			<h2 className="text-2xl font-semibold">Songs</h2>
			<div className="grid gap-3">
				{songs.map((song) => (
					<SongItem
						key={song.id}
						song={song}
						onPlay={handlePlay}
						onAddToQueue={handleAddToQueue}
						onDownload={handleDownload}
						showDownload={true}
					/>
				))}
			</div>
		</div>
	);
});
